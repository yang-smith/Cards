import os
from pathlib import Path
from typing import List, Optional, Dict
from datetime import datetime
from slugify import slugify
import json
import numpy as np
from rank_bm25 import BM25Okapi

from .card import Card, CardContent, CardSource, CardIndex, CardConnection

class Storage:
    """File-based storage management for cards"""
    
    def __init__(self, base_dir: str = "data"):
        self.base_dir = Path(base_dir)
        self.cards_dir = self.base_dir / "cards"
        self.index_dir = self.base_dir / "index"
        
        # Create directories
        self.cards_dir.mkdir(parents=True, exist_ok=True)
        self.index_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize search index
        self._bm25_index = None
        self._card_cache = {}
        self._initialize_index()

    def _initialize_index(self):
        """Initialize search indexes"""
        cards = self.list_cards()
        if cards:
            # Create BM25 index
            texts = [f"{card.title} {card.content.summary} {card.content.content}" 
                    for card in cards]
            tokenized_texts = [text.lower().split() for text in texts]
            self._bm25_index = BM25Okapi(tokenized_texts)
            
            # Cache cards
            self._card_cache = {card.id: card for card in cards}

    def _get_card_path(self, card: Card) -> Path:
        """Generate file path for a card"""
        return self.cards_dir / f"{card.id}.md"

    def save_card(self, card: Card) -> bool:
        """Save card to file system"""
        try:
            card.updated_at = datetime.now()
            card_path = self._get_card_path(card)
            card_content = card.to_markdown()
            
            with open(card_path, 'w', encoding='utf-8') as f:
                f.write(card_content)
                
            # Update cache and index
            self._card_cache[card.id] = card
            self._initialize_index()  # Rebuild index
            
            return True
        except Exception as e:
            print(f"Error saving card: {e}")
            return False

    def load_card(self, card_id: str) -> Optional[Card]:
        """Load card from file system"""
        # Check cache first
        if card_id in self._card_cache:
            return self._card_cache[card_id]
            
        try:
            card_path = self.cards_dir / f"{card_id}.md"
            if not card_path.exists():
                return None
                
            with open(card_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            card = Card.from_markdown(content)
            self._card_cache[card_id] = card
            return card
        except Exception as e:
            print(f"Error loading card: {e}")
            return None

    def list_cards(self) -> List[Card]:
        """List all cards in storage"""
        cards = []
        for card_path in self.cards_dir.glob("*.md"):
            try:
                with open(card_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                cards.append(Card.from_markdown(content))
            except Exception as e:
                print(f"Error loading card {card_path}: {e}")
                continue
        return cards

    def search_cards(self, query: str, limit: int = 10) -> List[tuple[Card, float]]:
        """Search cards using BM25"""
        if not self._bm25_index:
            return []
            
        # Tokenize query
        tokenized_query = query.lower().split()
        
        # Get scores
        scores = self._bm25_index.get_scores(tokenized_query)
        
        # Get cards with scores
        cards = list(self._card_cache.values())
        card_scores = list(zip(cards, scores))
        
        # Sort by score and return top results
        return sorted(card_scores, key=lambda x: x[1], reverse=True)[:limit]

    def add_connection(self, from_id: str, to_id: str, strength: int = 1) -> bool:
        """Add a connection between two cards"""
        try:
            from_card = self.load_card(from_id)
            to_card = self.load_card(to_id)
            
            if not from_card or not to_card:
                return False
                
            # Add connection to from_card
            connection = CardConnection(
                card_id=to_id,
                strength=strength
            )
            from_card.connections.append(connection)
            
            # Save the updated card
            return self.save_card(from_card)
            
        except Exception as e:
            print(f"Error adding connection: {e}")
            return False

    def get_connected_cards(self, card_id: str) -> List[tuple[Card, int]]:
        """Get all cards connected to the given card"""
        try:
            card = self.load_card(card_id)
            if not card:
                return []
                
            connected = []
            for conn in card.connections:
                connected_card = self.load_card(conn.card_id)
                if connected_card:
                    connected.append((connected_card, conn.strength))
                    
            return connected
            
        except Exception as e:
            print(f"Error getting connected cards: {e}")
            return []

    def delete_card(self, card_id: str) -> bool:
        """Delete card from file system"""
        try:
            card_path = self.cards_dir / f"{card_id}.md"
            if card_path.exists():
                card_path.unlink()
            return True
        except Exception as e:
            print(f"Error deleting card: {e}")
            return False 