import streamlit as st
from core.card import Card, CardContent, CardSource, CardIndex, CardConnection
from core.storage import Storage
from datetime import datetime
import numpy as np

def create_card_form(storage: Storage):
    """Form for creating a new card"""
    st.header("Create New Card")
    
    title = st.text_input("Title")
    summary = st.text_area("Summary (Brief description)", height=100)
    content = st.text_area("Content (Full details)", height=200)
    
    col1, col2 = st.columns(2)
    with col1:
        source_type = st.selectbox("Source Type", 
            ["note", "article", "book", "video", "conversation"])
        context = st.text_input("Context/Background")
    
    with col2:
        keywords = st.text_input("Keywords (comma separated)")
        category = st.selectbox("Category", 
            ["general", "tech", "science", "philosophy", "other"])
    
    if st.button("Save Card"):
        if title and content:
            # Create card objects
            card_content = CardContent(
                summary=summary,
                content=content
            )
            
            card_source = CardSource(
                type=source_type,
                timestamp=datetime.now(),
                context=context
            )
            
            card_index = CardIndex(
                keywords=[k.strip() for k in keywords.split(",") if k.strip()],
                category=category
            )
            
            card = Card(
                id=None,  # Will be auto-generated
                title=title,
                content=card_content,
                source=card_source,
                index=card_index
            )
            
            if storage.save_card(card):
                st.success("Card saved successfully!")
                return True
            else:
                st.error("Error saving card")
        else:
            st.warning("Please fill in title and content")
    
    return False

def view_cards(storage: Storage):
    """View and search cards"""
    st.header("Knowledge Cards")
    
    # Search
    search_query = st.text_input("Search cards")
    if search_query:
        results = storage.search_cards(search_query)
        if results:
            st.subheader("Search Results")
            for card, score in results:
                with st.expander(f"{card.title} (Score: {score:.2f})"):
                    st.markdown(f"**Summary:** {card.content.summary}")
                    st.markdown(f"**Content:** {card.content.content}")
                    st.markdown(f"**Category:** {card.index.category}")
                    st.markdown(f"**Keywords:** {', '.join(card.index.keywords)}")
                    
                    # Show connections
                    connections = storage.get_connected_cards(card.id)
                    if connections:
                        st.markdown("**Connected Cards:**")
                        for connected_card, strength in connections:
                            st.markdown(f"- {connected_card.title} (Strength: {strength})")
        else:
            st.info("No results found")
    
    # List all cards
    st.subheader("All Cards")
    cards = storage.list_cards()
    
    for card in cards:
        with st.expander(f"{card.title} - {card.source.timestamp.strftime('%Y-%m-%d')}"):
            st.markdown(f"**Summary:** {card.content.summary}")
            st.markdown(f"**Content:** {card.content.content}")
            st.markdown(f"**Category:** {card.index.category}")
            st.markdown(f"**Keywords:** {', '.join(card.index.keywords)}")
            
            # Add connection interface
            st.markdown("---")
            col1, col2 = st.columns(2)
            with col1:
                connect_to = st.selectbox(
                    f"Connect to another card",
                    options=[c.id for c in cards if c.id != card.id],
                    key=f"connect_{card.id}"
                )
            with col2:
                strength = st.slider(
                    "Connection Strength",
                    min_value=1,
                    max_value=5,
                    value=1,
                    key=f"strength_{card.id}"
                )
            
            if st.button("Add Connection", key=f"btn_{card.id}"):
                if storage.add_connection(card.id, connect_to, strength):
                    st.success("Connection added!")
                else:
                    st.error("Error adding connection")

def main():
    st.title("Knowledge Companion")
    
    # Initialize storage
    storage = Storage()
    
    # Sidebar navigation
    st.sidebar.title("Navigation")
    action = st.sidebar.radio("Choose action", ["Create Card", "View Cards"])
    
    if action == "Create Card":
        create_card_form(storage)
    else:
        view_cards(storage)

if __name__ == "__main__":
    main()