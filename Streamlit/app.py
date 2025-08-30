import streamlit as st
import requests
import fitz  # PyMuPDF for PDF extraction
from gtts import gTTS
import io

# Configure Streamlit
st.set_page_config(page_title="StudyMate", layout="wide")

# API Configuration
API_BASE_URL = 'http://localhost:8001/hackrx'

# Clean Theme Configuration
THEMES = {
    "Light": {
        "background": "#ffffff",
        "text_color": "#1f2937",
        "secondary_bg": "#f3f4f6",
        "button_color": "#3b82f6",
        "button_text": "#ffffff",
        "accent": "#10b981",
        "border": "#e5e7eb"
    },
    "Dark": {
        "background": "#1f2937",
        "text_color": "#f9fafb",
        "secondary_bg": "#374151",
        "button_color": "#60a5fa",
        "button_text": "#ffffff",
        "accent": "#34d399",
        "border": "#4b5563"
    }
}

# Sidebar Navigation
st.sidebar.title("🎓 StudyMate")
theme = st.sidebar.selectbox("🎨 Theme", list(THEMES.keys()))
page = st.sidebar.radio("📱 Navigation", ["📄 Upload Documents", "🤖 AI Chat", "🔊 Audio Summaries"])

colors = THEMES[theme]

# Apply Custom Styling
st.markdown(f"""
<style>
    /* Main app styling */
    .stApp {{
        background-color: {colors['background']} !important;
        color: {colors['text_color']} !important;
    }}
    
    /* Button styling */
    .stButton > button {{
        background-color: {colors['button_color']} !important;
        color: {colors['button_text']} !important;
        border-radius: 8px !important;
        border: none !important;
        padding: 0.5rem 1rem !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
    }}
    
    .stButton > button:hover {{
        background-color: {colors['accent']} !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }}
    
    /* Input styling */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea {{
        background-color: {colors['secondary_bg']} !important;
        color: {colors['text_color']} !important;
        border: 2px solid {colors['border']} !important;
        border-radius: 8px !important;
        padding: 0.75rem !important;
    }}
    
    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus {{
        border-color: {colors['button_color']} !important;
        box-shadow: 0 0 0 3px {colors['button_color']}20 !important;
    }}
    
    /* File uploader styling */
    .stFileUploader > div > div {{
        background-color: {colors['secondary_bg']} !important;
        border: 2px dashed {colors['border']} !important;
        border-radius: 12px !important;
        padding: 2rem !important;
        text-align: center !important;
    }}
    
    /* Success/Error messages */
    .stSuccess {{
        background-color: {colors['accent']}20 !important;
        color: {colors['accent']} !important;
        border-left: 4px solid {colors['accent']} !important;
    }}
    
    /* Custom containers */
    .answer-container {{
        background-color: {colors['secondary_bg']} !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
        margin: 1rem 0 !important;
        border-left: 4px solid {colors['button_color']} !important;
    }}
    
    .document-preview {{
        background-color: {colors['secondary_bg']} !important;
        border-radius: 8px !important;
        padding: 1rem !important;
        max-height: 300px !important;
        overflow-y: auto !important;
        border: 1px solid {colors['border']} !important;
    }}
    
    /* Audio player styling */
    audio {{
        width: 100% !important;
        border-radius: 8px !important;
        background-color: {colors['secondary_bg']} !important;
    }}
</style>
""", unsafe_allow_html=True)

# Initialize Session State
if 'text' not in st.session_state:
    st.session_state.text = ""
if 'notebook_id' not in st.session_state:
    st.session_state.notebook_id = None
if 'notebook_data' not in st.session_state:
    st.session_state.notebook_data = {}
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'audio_url' not in st.session_state:
    st.session_state.audio_url = ""

# Helper Functions
def create_speech_audio(text):
    """Generate speech audio from text using gTTS"""
    try:
        tts = gTTS(text=text, lang='en', slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        return audio_buffer
    except Exception as e:
        st.error(f"Speech generation error: {e}")
        return None

def create_notebook_api(uploaded_file):
    """Create notebook via backend API"""
    try:
        files = {'file': (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
        response = requests.post(f'{API_BASE_URL}/create-notebook', files=files)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"❌ Error creating notebook: {e}")
        return None

def query_notebook_api(notebook_id, question):
    """Query notebook via backend API"""
    try:
        payload = {"notebook_id": notebook_id, "question": question}
        response = requests.post(f'{API_BASE_URL}/query-notebook', json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"❌ Error querying notebook: {e}")
        return None

def generate_audio_summary_api(notebook_id, notebook_content):
    """Generate audio summary via backend API"""
    try:
        payload = {"notebook_id": notebook_id, "notebook_content": notebook_content}
        response = requests.post(f'{API_BASE_URL}/get-summary', json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"❌ Error generating audio summary: {e}")
        return None

# Main App Title
st.markdown(f"""
<div style="text-align: center; padding: 2rem 0;">
    <h1 style="color: {colors['text_color']}; font-size: 3rem; margin-bottom: 0.5rem;">
        🎓 StudyMate
    </h1>
    <p style="color: {colors['text_color']}; font-size: 1.2rem; opacity: 0.8;">
        AI-Powered Research Assistant with Speech Features
    </p>
</div>
""", unsafe_allow_html=True)

# Page Content Based on Navigation
if page == "📄 Upload Documents":
    st.header("📄 Document Upload")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        uploaded_file = st.file_uploader(
            "📁 Choose a PDF file", 
            type=['pdf'],
            help="Upload a PDF document to create an AI notebook"
        )
        
        if uploaded_file and not st.session_state.notebook_id:
            with st.spinner("🔄 Processing document... Please wait"):
                result = create_notebook_api(uploaded_file)
                if result:
                    st.session_state.notebook_id = result['notebook_id']
                    st.session_state.notebook_data = result
                    st.session_state.text = result.get('content', '')
                    
                    st.success("✅ Document processed successfully!")
                    
                    # Display document info
                    st.markdown(f"""
                    <div class="answer-container">
                        <h3 style="color: {colors['accent']};">📋 Document Information</h3>
                        <p><strong>Title:</strong> {result['title']}</p>
                        <p><strong>Filename:</strong> {result['pdf_filename']}</p>
                        <p><strong>Created:</strong> {result['created_at']}</p>
                        <p><strong>Notebook ID:</strong> {result['notebook_id'][:12]}...</p>
                    </div>
                    """, unsafe_allow_html=True)
    
    with col2:
        if st.session_state.notebook_id:
            st.markdown(f"""
            <div style="background-color: {colors['accent']}20; padding: 1rem; border-radius: 8px; text-align: center;">
                <h3 style="color: {colors['accent']};">✅ Notebook Active</h3>
                <p>Ready for AI analysis!</p>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div style="background-color: {colors['border']}40; padding: 1rem; border-radius: 8px; text-align: center;">
                <h3>📤 Upload a Document</h3>
                <p>Get started by uploading a PDF</p>
            </div>
            """, unsafe_allow_html=True)
    
    # Document Preview
    if st.session_state.text:
        st.markdown("### 📖 Document Preview")
        preview_text = st.session_state.text[:2000] + "..." if len(st.session_state.text) > 2000 else st.session_state.text
        st.markdown(f"""
        <div class="document-preview">
            {preview_text}
        </div>
        """, unsafe_allow_html=True)

elif page == "🤖 AI Chat":
    st.header("🤖 AI Chat Assistant")
    
    if not st.session_state.notebook_id:
        st.warning("⚠️ Please upload a document first to enable AI chat.")
        st.stop()
    
    # Chat Interface
    col1, col2 = st.columns([3, 1])
    
    with col1:
        question = st.text_input(
            "💬 Ask your question:", 
            placeholder="What would you like to know about your document?"
        )
    
    with col2:
        ask_button = st.button("🚀 Ask AI", type="primary")
    
    if ask_button and question.strip():
        with st.spinner("🤔 AI is thinking..."):
            result = query_notebook_api(st.session_state.notebook_id, question.strip())
            if result:
                answer = result.get('answer', 'No answer received')
                
                # Display answer
                st.markdown(f"""
                <div class="answer-container">
                    <h4 style="color: {colors['button_color']};">❓ Question:</h4>
                    <p>{question}</p>
                    <h4 style="color: {colors['accent']};">✅ Answer:</h4>
                    <p>{answer}</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Generate and play speech
                st.markdown("### 🔊 Listen to Answer")
                audio_buffer = create_speech_audio(answer)
                if audio_buffer:
                    st.audio(audio_buffer, format='audio/mp3')
                    st.success("🎵 Audio generated! Click play to listen.")
                
                # Add to chat history
                st.session_state.chat_history.extend([
                    f"You: {question}",
                    f"AI: {answer}"
                ])
    
    # Chat History
    if st.session_state.chat_history:
        st.markdown("### 📚 Chat History")
        for i, message in enumerate(st.session_state.chat_history[-6:]):  # Show last 6 messages
            if i % 2 == 0:  # User messages
                st.markdown(f"""
                <div style="background-color: {colors['button_color']}20; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0;">
                    <strong>🧑‍💻 {message}</strong>
                </div>
                """, unsafe_allow_html=True)
            else:  # AI messages
                st.markdown(f"""
                <div style="background-color: {colors['accent']}20; padding: 0.5rem; border-radius: 8px; margin: 0.5rem 0;">
                    <strong>🤖 {message}</strong>
                </div>
                """, unsafe_allow_html=True)

elif page == "🔊 Audio Summaries":
    st.header("🔊 Audio Summaries")
    
    if not st.session_state.notebook_id:
        st.warning("⚠️ Please upload a document first to generate audio summaries.")
        st.stop()
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.markdown("### 🎙️ Generate Audio Summary")
        st.info("Create an AI-generated audio summary of your document for easy listening.")
        
        if st.button("🎵 Generate Audio Summary", type="primary"):
            with st.spinner("🎙️ Generating audio summary... Please wait"):
                result = generate_audio_summary_api(
                    st.session_state.notebook_id, 
                    st.session_state.notebook_data
                )
                if result:
                    st.session_state.audio_url = result.get('audioUrl', '')
                    st.success("✅ Audio summary generated successfully!")
                    st.rerun()
    
    with col2:
        if st.session_state.notebook_data:
            st.markdown("### 📊 Document Stats")
            qa_count = len(st.session_state.notebook_data.get('questions_answers', []))
            st.metric("📝 Questions Asked", qa_count)
            st.metric("📄 Document Size", f"{len(st.session_state.text):,} chars")
    
    # Audio Player
    if st.session_state.audio_url:
        st.markdown("### 🎧 Audio Player")
        st.audio(st.session_state.audio_url, format='audio/mp3')
        st.success("🎉 Your audio summary is ready! Click the play button above to listen.")
        
        # Download link
        st.markdown(f"[⬇️ Download Audio Summary]({st.session_state.audio_url})")

# Sidebar Status
st.sidebar.markdown("---")
st.sidebar.markdown("### 📊 Session Status")
if st.session_state.notebook_id:
    st.sidebar.success("✅ Document Loaded")
    st.sidebar.info(f"📄 ID: {st.session_state.notebook_id[:12]}...")
else:
    st.sidebar.warning("❌ No Document")

st.sidebar.metric("💬 Chat Messages", len(st.session_state.chat_history))

# Clear session button
if st.sidebar.button("🗑️ Clear Session"):
    for key in st.session_state.keys():
        del st.session_state[key]
    st.rerun()

# Footer
st.markdown("---")
st.markdown(f"""
<div style='text-align: center; padding: 2rem; color: {colors['text_color']}; opacity: 0.7;'>
    <p>🎓 <strong>StudyMate</strong> © 2025 - AI-Powered Research Assistant</p>
    <p>Built with FastAPI & Streamlit | Speech-Enabled Learning</p>
</div>
""", unsafe_allow_html=True)
