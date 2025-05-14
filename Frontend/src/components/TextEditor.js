import React, { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import '../styles/TextEditor.css';
import { CustomAlert } from './Alert';
import { fetchWithCorsHandling, getFetchOptions } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const TextEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [alert, setAlert] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [textContents, setTextContents] = useState([]);
  const [version, setVersion] = useState(1);
  const [formattingOptions, setFormattingOptions] = useState({
    font_size: 16,
    font_family: 'Arial',
    color: '#333'
  });

  useEffect(() => {
    fetchCourses();
    fetchTextContents();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetchWithCorsHandling(
        'http://127.0.0.1:8000/courses/',
        getFetchOptions('GET')
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      setError(error.message);
      showAlert('error', 'Error', 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchTextContents = async () => {
    try {
      const response = await fetchWithCorsHandling(
        'http://127.0.0.1:8000/text-contents/',
        getFetchOptions('GET')
      );

      if (!response.ok) {
        throw new Error('Failed to fetch text contents');
      }

      const data = await response.json();
      setTextContents(Array.isArray(data.text_contents) ? data.text_contents : []);
    } catch (error) {
      console.error('Error fetching text contents:', error);
      showAlert('error', 'Error', 'Failed to fetch text contents');
      setTextContents([]);
    }
  };

  const showAlert = (severity, title, message) => {
    setAlert({ severity, title, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = (inlineStyle) => {
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
    }
  };

  const handleSave = async () => {
    if (!selectedCourse) {
      showAlert('warning', 'Warning', 'Please select a course first');
      return;
    }

    try {
      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      const rawText = contentState.getPlainText();
      
      const textContent = {
        course_id: parseInt(selectedCourse),
        raw_text: rawText,
        formatted_text: rawText,
        version: 1,
        published: isPublished
      };

      const response = await fetchWithCorsHandling(
        'http://127.0.0.1:8000/text-contents/',
        getFetchOptions('POST', textContent)
      );

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      showAlert('success', 'Success', 'Content saved successfully');
      fetchTextContents();
    } catch (error) {
      showAlert('error', 'Error', 'Failed to save content');
    }
  };

  const handlePublish = async () => {
    if (!selectedCourse) {
      showAlert('warning', 'Warning', 'Please select a course first');
      return;
    }

    try {
      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      const rawText = contentState.getPlainText();

      const textContent = {
        course_id: parseInt(selectedCourse),
        raw_text: rawText,
        formatted_text: rawText,
        version: 1,
        published: !isPublished
      };

      const response = await fetchWithCorsHandling(
        'http://127.0.0.1:8000/text-contents/',
        getFetchOptions('POST', textContent)
      );

      if (!response.ok) {
        throw new Error('Failed to update publish status');
      }

      setIsPublished(!isPublished);
      showAlert(
        'success',
        isPublished ? 'Unpublished' : 'Published',
        `Content ${isPublished ? 'unpublished' : 'published'} successfully`
      );
      fetchTextContents();
    } catch (error) {
      showAlert('error', 'Error', 'Failed to update publish status');
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    
    if (!courseId) {
      setEditorState(EditorState.createEmpty());
      setIsPublished(false);
      return;
    }

    if (Array.isArray(textContents)) {
      const courseContent = textContents.find(content => content.course_id === parseInt(courseId));
      if (courseContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = courseContent.formatted_text || courseContent.raw_text;
        const plainText = tempDiv.textContent || tempDiv.innerText;
        
        const contentState = ContentState.createFromText(plainText);
        setEditorState(EditorState.createWithContent(contentState));
        setIsPublished(courseContent.published);
        
        if (courseContent.formatting_options) {
          setFormattingOptions(courseContent.formatting_options);
        }
      } else {
        setEditorState(EditorState.createEmpty());
        setIsPublished(false);
      }
    } else {
      setEditorState(EditorState.createEmpty());
      setIsPublished(false);
    }
  };

  const handleFormattingChange = (option, value) => {
    setFormattingOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const convertToHTML = (rawContent) => {
    let html = '';
    rawContent.blocks.forEach(block => {
      const text = block.text;
      const type = block.type;
      const inlineStyles = block.inlineStyleRanges;
      
      let styledText = text;
      inlineStyles.forEach(style => {
        const styleType = style.style;
        const start = style.offset;
        const end = start + style.length;
        
        switch (styleType) {
          case 'BOLD':
            styledText = styledText.slice(0, start) + 
                        `<b>${styledText.slice(start, end)}</b>` + 
                        styledText.slice(end);
            break;
          case 'ITALIC':
            styledText = styledText.slice(0, start) + 
                        `<i>${styledText.slice(start, end)}</i>` + 
                        styledText.slice(end);
            break;
          case 'UNDERLINE':
            styledText = styledText.slice(0, start) + 
                        `<u>${styledText.slice(start, end)}</u>` + 
                        styledText.slice(end);
            break;
        }
      });

      switch (type) {
        case 'header-one':
          html += `<h1>${styledText}</h1>`;
          break;
        case 'header-two':
          html += `<h2>${styledText}</h2>`;
          break;
        case 'header-three':
          html += `<h3>${styledText}</h3>`;
          break;
        case 'unordered-list-item':
          html += `<ul><li>${styledText}</li></ul>`;
          break;
        case 'ordered-list-item':
          html += `<ol><li>${styledText}</li></ol>`;
          break;
        case 'blockquote':
          html += `<blockquote>${styledText}</blockquote>`;
          break;
        default:
          html += `<p>${styledText}</p>`;
      }
    });
    return html;
  };

  const BlockStyleControls = () => {
    const BLOCK_TYPES = [
      { label: 'H1', style: 'header-one' },
      { label: 'H2', style: 'header-two' },
      { label: 'H3', style: 'header-three' },
      { label: 'H4', style: 'header-four' },
      { label: 'H5', style: 'header-five' },
      { label: 'H6', style: 'header-six' },
      { label: 'Blockquote', style: 'blockquote' },
      { label: 'UL', style: 'unordered-list-item' },
      { label: 'OL', style: 'ordered-list-item' },
      { label: 'Code Block', style: 'code-block' },
    ];

    const currentBlockType = editorState
      .getCurrentContent()
      .getBlockForKey(editorState.getSelection().getStartKey())
      .getType();

    return (
      <div className="toolbar-group">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type.label}
            className={`toolbar-button ${currentBlockType === type.style ? 'active' : ''}`}
            onClick={() => toggleBlockType(type.style)}
          >
            {type.label}
          </button>
        ))}
      </div>
    );
  };

  const InlineStyleControls = () => {
    const INLINE_STYLES = [
      { label: 'Bold', style: 'BOLD' },
      { label: 'Italic', style: 'ITALIC' },
      { label: 'Underline', style: 'UNDERLINE' },
      { label: 'Strikethrough', style: 'STRIKETHROUGH' },
      { label: 'Monospace', style: 'CODE' },
    ];

    const currentStyle = editorState.getCurrentInlineStyle();

    return (
      <div className="toolbar-group">
        {INLINE_STYLES.map((type) => (
          <button
            key={type.label}
            className={`toolbar-button ${currentStyle.has(type.style) ? 'active' : ''}`}
            onClick={() => toggleInlineStyle(type.style)}
          >
            {type.label}
          </button>
        ))}
      </div>
    );
  };

  const AlignmentControls = () => {
    const ALIGNMENT_TYPES = [
      { label: 'Left', style: 'left' },
      { label: 'Center', style: 'center' },
      { label: 'Right', style: 'right' },
      { label: 'Justify', style: 'justify' },
    ];

    return (
      <div className="toolbar-group">
        {ALIGNMENT_TYPES.map((type) => (
          <button
            key={type.label}
            className={`toolbar-button ${editorState.getCurrentContent().getBlockForKey(editorState.getSelection().getStartKey()).getData().get('textAlign') === type.style ? 'active' : ''}`}
            onClick={() => toggleBlockType(type.style)}
          >
            {type.label}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="large" color="#1976d2" />
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="text-editor-container">
      {alert && (
        <CustomAlert
          severity={alert.severity}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="editor-header">
        <div className="header-content">
          <img 
            src="/icons/book.svg" 
            alt="Text Management" 
            className="header-icon"
          />
          <h2 className="section-title">Text Management</h2>
        </div>
        <div className="editor-actions">
          <button className="action-button save" onClick={handleSave}>Save</button>
          <button 
            className={`action-button publish ${isPublished ? 'published' : ''}`} 
            onClick={handlePublish}
          >
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="course-selector">
        <label htmlFor="course-select">Select Course:</label>
        <select 
          id="course-select" 
          value={selectedCourse} 
          onChange={handleCourseChange}
          className="course-dropdown"
        >
          <option value="">Select a course...</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>
      
      <div className="formatting-options">
        <div className="format-group">
          <label>Font Size:</label>
          <input 
            type="number" 
            value={formattingOptions.font_size}
            onChange={(e) => handleFormattingChange('font_size', parseInt(e.target.value))}
            min="12"
            max="72"
          />
        </div>
        <div className="format-group">
          <label>Font Family:</label>
          <select 
            value={formattingOptions.font_family}
            onChange={(e) => handleFormattingChange('font_family', e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Georgia">Georgia</option>
          </select>
        </div>
        <div className="format-group">
          <label>Text Color:</label>
          <input 
            type="color" 
            value={formattingOptions.color}
            onChange={(e) => handleFormattingChange('color', e.target.value)}
          />
        </div>
      </div>
      
      <div className="editor-toolbar">
        <InlineStyleControls />
        <BlockStyleControls />
        <AlignmentControls />
      </div>

      <div className="editor-content">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          placeholder="Start typing your content here..."
        />
      </div>
    </div>
  );
};

export default TextEditor; 