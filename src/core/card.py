from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import List, Optional, Dict, Any
import yaml
import frontmatter
import numpy as np

@dataclass
class CardContent:
    """Content structure for a card"""
    summary: str
    content: str

@dataclass
class CardSource:
    """Source information for a card"""
    type: str
    timestamp: datetime
    context: Optional[str] = None
    url: Optional[str] = None
    
@dataclass
class CardIndex:
    """Index information for a card"""
    keywords: List[str] = field(default_factory=list)
    vector_embedding: Optional[np.ndarray] = None
    category: Optional[str] = None

@dataclass
class CardConnection:
    """Connection to another card"""
    card_id: str
    strength: int
    created_at: datetime = field(default_factory=datetime.now)
    
@dataclass
class Card:
    """
    Core card class representing a knowledge card in the system.
    """
    id: Optional[str]
    title: str
    content: CardContent
    source: CardSource
    index: CardIndex = field(default_factory=CardIndex)
    connections: List[CardConnection] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        if self.id is None:
            from slugify import slugify
            self.id = slugify(self.title)

    def to_markdown(self) -> str:
        """Convert card to markdown format with frontmatter"""
        # Convert to dict while handling numpy array
        metadata = asdict(self, dict_factory=self._serialize_dict)
        
        # The main content goes in the markdown body
        content = f"# {self.title}\n\n{self.content.content}"
        
        return frontmatter.Post(content, **metadata).to_string()

    @staticmethod
    def _serialize_dict(data: Dict) -> Dict:
        """Helper to serialize special types"""
        result = {}
        for k, v in data.items():
            if isinstance(v, np.ndarray):
                result[k] = v.tolist() if v is not None else None
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            else:
                result[k] = v
        return result

    @classmethod
    def from_markdown(cls, markdown_content: str) -> 'Card':
        """Create card from markdown content with frontmatter"""
        post = frontmatter.loads(markdown_content)
        metadata = post.metadata
        
        # Convert stored formats back to objects
        metadata = cls._deserialize_dict(metadata)
        
        # Extract title and content from markdown body
        content_lines = post.content.split('\n')
        title = content_lines[0].lstrip('# ')
        content = '\n'.join(content_lines[2:])
        
        # Update content in metadata
        metadata['content'].content = content
        metadata['title'] = title
        
        return cls(**metadata)

    @staticmethod
    def _deserialize_dict(data: Dict) -> Dict:
        """Helper to deserialize special types"""
        if isinstance(data, dict):
            result = {}
            for k, v in data.items():
                if k in ['vector_embedding'] and v is not None:
                    result[k] = np.array(v)
                elif k in ['created_at', 'updated_at', 'timestamp']:
                    result[k] = datetime.fromisoformat(v)
                elif isinstance(v, dict):
                    result[k] = Card._deserialize_dict(v)
                else:
                    result[k] = v
            return result
        return data 