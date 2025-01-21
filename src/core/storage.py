import csv
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import json
import pickle
from rank_bm25 import BM25Okapi

from .card import Card

class Storage:
    """CSV-based storage management for cards"""
    
    def __init__(self, base_dir: str = "data"):
        self.base_dir = Path(base_dir)
        self.cards_file = self.base_dir / "cards.csv"
        self.index_dir = self.base_dir / "index"
        self.bm25_file = self.index_dir / "bm25.pkl"
        
        # Create directories and files
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.index_dir.mkdir(parents=True, exist_ok=True)
        
        if not self.cards_file.exists():
            self._create_csv_file()
        
        # Initialize indexes
        self._bm25_index = None
        self._card_cache = {}
        self._initialize_index()

    def _create_csv_file(self):
        """Create CSV file with headers"""
        headers = ['id', 'title', 'content', 'metadata', 'index', 'connections']
        with open(self.cards_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()

    def _initialize_index(self):
        """Initialize search indexes"""
        cards = self.list_cards()
        if cards:
            self._build_bm25_index(cards)
            # Cache cards
            self._card_cache = {card.id: card for card in cards}

    def _build_bm25_index(self, cards: List[Card]):
        """Build BM25 index from cards"""
        # Prepare documents for indexing
        documents = []
        for card in cards:
            # Combine title, content and keywords for better search
            keywords = card.index.get('keywords', [])
            doc = f"{card.title} {card.content} {' '.join(keywords)}"
            documents.append(doc)

        # Tokenize and build index
        tokenized_docs = [doc.lower().split() for doc in documents]
        self._bm25_index = BM25Okapi(tokenized_docs)
        
        # Save index to file
        self._save_index()

    def _save_index(self):
        """Save BM25 index to file"""
        if self._bm25_index:
            with open(self.bm25_file, 'wb') as f:
                pickle.dump(self._bm25_index, f)

    def _load_index(self) -> bool:
        """Load BM25 index from file"""
        try:
            if self.bm25_file.exists():
                with open(self.bm25_file, 'rb') as f:
                    self._bm25_index = pickle.load(f)
                return True
            return False
        except Exception as e:
            print(f"Error loading index: {e}")
            return False

    def save_card(self, card: Card) -> bool:
        """Save card to CSV file"""
        try:
            # Update timestamp
            card.update_timestamp()
            cards = self.list_cards()
            
            # Update existing card or add new one
            card_dict = card.to_dict()
            updated = False
            
            with open(self.cards_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=card_dict.keys())
                writer.writeheader()
                
                for existing_card in cards:
                    if existing_card.id == card.id:
                        writer.writerow(card_dict)
                        updated = True
                    else:
                        writer.writerow(existing_card.to_dict())
                
                if not updated:
                    writer.writerow(card_dict)
            
            # Update cache and rebuild index
            self._card_cache[card.id] = card
            self._build_bm25_index(self.list_cards())
            return True
            
        except Exception as e:
            print(f"Error saving card: {e}")
            return False

    def load_card(self, card_id: str) -> Optional[Card]:
        """Load card from CSV file"""
        # Check cache first
        if card_id in self._card_cache:
            return self._card_cache[card_id]
            
        try:
            with open(self.cards_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row['id'] == card_id:
                        card = Card.from_dict(row)
                        self._card_cache[card_id] = card
                        return card
            return None
            
        except Exception as e:
            print(f"Error loading card: {e}")
            return None

    def list_cards(self) -> List[Card]:
        """List all cards from CSV file"""
        cards = []
        try:
            with open(self.cards_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cards.append(Card.from_dict(row))
            return cards
        except Exception as e:
            print(f"Error listing cards: {e}")
            return []

    def search_cards(self, query: str, limit: int = 10) -> List[Tuple[Card, float]]:
        """Search cards using BM25"""
        if not self._bm25_index:
            if not self._load_index():
                return []
            
        # Tokenize query
        tokenized_query = query.lower().split()
        
        # Get scores
        scores = self._bm25_index.get_scores(tokenized_query)
        
        # Get cards with scores
        cards = list(self._card_cache.values())
        card_scores = list(zip(cards, scores))
        
        # Sort by score and filter out zero scores
        filtered_results = [(card, score) for card, score in card_scores if score > 0]
        sorted_results = sorted(filtered_results, key=lambda x: x[1], reverse=True)
        
        return sorted_results[:limit]

    def get_similar_cards(self, card_id: str, limit: int = 5) -> List[Tuple[Card, float]]:
        """Find similar cards using BM25"""
        card = self.load_card(card_id)
        if not card:
            return []
            
        # Use card content as query
        query = f"{card.title} {card.content}"
        results = self.search_cards(query, limit + 1)  # +1 to account for the card itself
        
        # Remove the card itself from results
        return [(c, s) for c, s in results if c.id != card_id][:limit]

    def add_connection(self, from_id: str, to_id: str) -> bool:
        """Add a connection between two cards"""
        try:
            from_card = self.load_card(from_id)
            to_card = self.load_card(to_id)
            
            if not from_card or not to_card:
                return False
            
            if to_id not in from_card.connections:
                from_card.connections.append(to_id)
                return self.save_card(from_card)
            
            return True
            
        except Exception as e:
            print(f"Error adding connection: {e}")
            return False

    def delete_card(self, card_id: str) -> bool:
        """Delete card from CSV file"""
        try:
            cards = self.list_cards()
            with open(self.cards_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=cards[0].to_dict().keys())
                writer.writeheader()
                for card in cards:
                    if card.id != card_id:
                        writer.writerow(card.to_dict())
            
            if card_id in self._card_cache:
                del self._card_cache[card_id]
            self._initialize_index()
            return True
            
        except Exception as e:
            print(f"Error deleting card: {e}")
            return False 