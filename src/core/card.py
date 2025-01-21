from dataclasses import dataclass, asdict, field
from datetime import datetime
from typing import List, Optional, Dict, Any
import json
import csv
from pathlib import Path

@dataclass
class Card:
    """
    Core card class representing a knowledge card in the system.
    """
    id: Optional[str]
    title: str
    content: str
    metadata: Dict[str, Any]
    index: Dict[str, Any]
    connections: List[str]

    def __post_init__(self):
        if self.id is None:
            from slugify import slugify
            self.id = slugify(self.title)
        
        # Initialize timestamps in metadata if not present
        if 'created_at' not in self.metadata:
            self.metadata['created_at'] = datetime.now().isoformat()
        if 'updated_at' not in self.metadata:
            self.metadata['updated_at'] = datetime.now().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert card to dictionary format for CSV storage"""
        data = asdict(self)
        # Convert dictionaries and lists to JSON strings
        data['metadata'] = json.dumps(self.metadata, ensure_ascii=False)
        data['index'] = json.dumps(self.index, ensure_ascii=False)
        data['connections'] = json.dumps(self.connections, ensure_ascii=False)
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Card':
        """Create card from dictionary (loaded from CSV)"""
        # Convert JSON strings back to dictionaries and lists
        data['metadata'] = json.loads(data['metadata'])
        data['index'] = json.loads(data['index'])
        data['connections'] = json.loads(data['connections'])
        return cls(**data)

    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.metadata['updated_at'] = datetime.now().isoformat() 