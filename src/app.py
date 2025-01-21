import streamlit as st
from core.card import Card
from core.storage import Storage
from datetime import datetime

def create_card_form(storage: Storage):
    """Form for creating a new card"""
    st.header("Create New Card")
    
    title = st.text_input("Title")
    content = st.text_area("Content", height=200)
    
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
            # Create metadata dictionary
            metadata = {
                "source_type": source_type,
                "context": context,
                # Timestamps will be added in __post_init__
            }
            
            # Create index dictionary
            index = {
                "keywords": [k.strip() for k in keywords.split(",") if k.strip()],
                "category": category
            }
            
            card = Card(
                id=None,  # Will be auto-generated
                title=title,
                content=content,
                metadata=metadata,
                index=index,
                connections=[]
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
    col1, col2 = st.columns([3, 1])
    with col1:
        search_query = st.text_input("Search cards")
    with col2:
        min_score = st.slider("Min Score", 0.0, 10.0, 1.0, 0.1)
    
    if search_query:
        results = storage.search_cards(search_query)
        if results:
            st.subheader("Search Results")
            for card, score in results:
                if score >= min_score:
                    with st.expander(f"{card.title} (Score: {score:.2f})"):
                        st.markdown(f"**Content:** {card.content}")
                        st.markdown(f"**Category:** {card.index['category']}")
                        st.markdown(f"**Keywords:** {', '.join(card.index['keywords'])}")
                        st.markdown(f"**Created:** {datetime.fromisoformat(card.metadata['created_at']).strftime('%Y-%m-%d %H:%M')}")
                        
                        # Show similar cards
                        similar_cards = storage.get_similar_cards(card.id, limit=3)
                        if similar_cards:
                            st.markdown("**Similar Cards:**")
                            for similar_card, similarity in similar_cards:
                                st.markdown(f"- {similar_card.title} (Similarity: {similarity:.2f})")
                        
                        # Show connections
                        if card.connections:
                            st.markdown("**Connected Cards:**")
                            for conn_id in card.connections:
                                conn_card = storage.load_card(conn_id)
                                if conn_card:
                                    st.markdown(f"- {conn_card.title}")
        else:
            st.info("No results found")
    
    # List all cards
    st.subheader("All Cards")
    cards = storage.list_cards()
    
    for card in cards:
        created_at = datetime.fromisoformat(card.metadata['created_at'])
        with st.expander(f"{card.title} - {created_at.strftime('%Y-%m-%d')}"):
            st.markdown(f"**Content:** {card.content}")
            st.markdown(f"**Category:** {card.index['category']}")
            st.markdown(f"**Keywords:** {', '.join(card.index['keywords'])}")
            st.markdown(f"**Last Updated:** {datetime.fromisoformat(card.metadata['updated_at']).strftime('%Y-%m-%d %H:%M')}")
            
            # Add connection interface
            st.markdown("---")
            other_cards = [c for c in cards if c.id != card.id]
            if other_cards:
                connect_to = st.selectbox(
                    f"Connect to another card",
                    options=[c.id for c in other_cards],
                    format_func=lambda x: next(c.title for c in other_cards if c.id == x),
                    key=f"connect_{card.id}"
                )
                
                if st.button("Add Connection", key=f"btn_{card.id}"):
                    if storage.add_connection(card.id, connect_to):
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