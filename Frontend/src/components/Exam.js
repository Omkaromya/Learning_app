import React, { useState } from 'react';
import { CustomAlert } from './Alert';
import '../styles/Exam.css';

const Exam = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [alert, setAlert] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [questionType, setQuestionType] = useState('mcq');
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState({
    text: '',
    type: 'mcq',
    options: ['', '', '', ''],
    correctAnswer: 0,
    isPublished: false,
    blanks: []
  });

  const courses = [
    { id: 1, name: 'Web Development' },
    { id: 2, name: 'Data Science' },
    { id: 3, name: 'Mobile App Development' },
    { id: 4, name: 'Machine Learning' },
    { id: 5, name: 'Cloud Computing' }
  ];

  const showAlert = (severity, title, message) => {
    setAlert({ severity, title, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const resetQuestionForm = () => {
    setQuestion({
      text: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: 0,
      isPublished: false,
      blanks: []
    });
    setQuestionType('mcq');
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setShowQuestionForm(false);
    resetQuestionForm();
  };

  const handleQuestionTypeChange = (e) => {
    const type = e.target.value;
    setQuestionType(type);
    setQuestion(prev => ({
      ...prev,
      type,
      options: type === 'mcq' ? ['', '', '', ''] : type === 'truefalse' ? ['True', 'False'] : ['', '', '', ''],
      correctAnswer: 0,
      blanks: type === 'fillblanks' ? [] : prev.blanks
    }));
  };

  const handleQuestionChange = (e) => {
    const text = e.target.value;
    setQuestion(prev => ({
      ...prev,
      text,
      blanks: prev.type === 'fillblanks' ? 
        text.match(/\[.*?\]/g)?.map(blank => blank.slice(1, -1)) || [] : 
        prev.blanks
    }));
  };

  const handleOptionChange = (index, value) => {
    setQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setQuestion(prev => ({
      ...prev,
      correctAnswer: index
    }));
  };

  const handleSave = () => {
    if (!question.text.trim()) {
      showAlert('error', 'Error', 'Please enter a question');
      return;
    }
    if (questionType === 'mcq' && question.options.some(opt => !opt.trim())) {
      showAlert('error', 'Error', 'Please fill all options');
      return;
    }
    if (questionType === 'fillblanks' && question.blanks.length === 0) {
      showAlert('error', 'Error', 'Please add at least one blank using [text] format');
      return;
    }
    
    const newQuestion = {
      ...question,
      id: questions.length + 1,
      courseId: selectedCourse
    };
    
    setQuestions([...questions, newQuestion]);
    showAlert('success', 'Success', 'Question saved successfully');
    setShowQuestionForm(false);
    resetQuestionForm();
  };

  const handlePublish = () => {
    if (!question.isPublished) {
      setQuestion(prev => ({ ...prev, isPublished: true }));
      showAlert('success', 'Success', 'Question published successfully');
    } else {
      setQuestion(prev => ({ ...prev, isPublished: false }));
      showAlert('info', 'Info', 'Question unpublished');
    }
  };

  const toggleViewQuestions = () => {
    setShowQuestions(!showQuestions);
    setShowQuestionForm(false);
  };

  const renderQuestions = () => {
    const courseQuestions = questions.filter(q => q.courseId === selectedCourse);
    const publishedQuestions = courseQuestions.filter(q => q.isPublished);

    if (publishedQuestions.length === 0) {
      return <div className="no-questions">No published questions available for this course.</div>;
    }

    return (
      <div className="questions-list">
        {publishedQuestions.map((q) => (
          <div key={q.id} className="question-card">
            <div className="question-header">
              <span className="question-type">
                {q.type === 'mcq' ? 'Multiple Choice' : 
                 q.type === 'truefalse' ? 'True/False' : 
                 'Fill in the Blanks'}
              </span>
              <span className="question-status published">Published</span>
            </div>
            <div className="question-content">
              <p className="question-text">
                {q.type === 'fillblanks' ? 
                  q.text.replace(/\[(.*?)\]/g, '_____') : 
                  q.text}
              </p>
              {q.type === 'fillblanks' ? (
                <div className="blanks-options">
                  {q.blanks.map((blank, index) => (
                    <div key={index} className="blank-option">
                      <span className="blank-number">Blank {index + 1}:</span>
                      <span className="blank-answer">{blank}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="options-list">
                  {q.options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`option ${index === q.correctAnswer ? 'correct' : ''}`}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="exam-container">
      {alert && (
        <CustomAlert
          severity={alert.severity}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="exam-header">
        <div className="header-content">
          <img 
            src="/icons/exam.svg" 
            alt="Exam" 
            className="header-icon"
          />
          <h2 className="section-title">Exam Management</h2>
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
          <option value="">Choose a course...</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      <div className="exam-content">
        {selectedCourse ? (
          <div className="exam-actions">
            <button 
              className="action-button create"
              onClick={() => {
                setShowQuestionForm(true);
                setShowQuestions(false);
              }}
            >
              Add Question
            </button>
            <button 
              className={`action-button view ${showQuestions ? 'active' : ''}`}
              onClick={toggleViewQuestions}
            >
              View Questions
            </button>
          </div>
        ) : (
          <div className="no-course-selected">
            Please select a course to manage exams
          </div>
        )}

        {showQuestionForm && (
          <div className="question-form">
            <div className="form-group">
              <label>Question Type:</label>
              <select 
                value={questionType} 
                onChange={handleQuestionTypeChange}
                className="question-type-select"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="truefalse">True/False</option>
                <option value="fillblanks">Fill in the Blanks</option>
              </select>
            </div>

            <div className="form-group">
              <label>Question:</label>
              <textarea
                value={question.text}
                onChange={handleQuestionChange}
                placeholder={questionType === 'fillblanks' ? 
                  "Enter your question with blanks in [text] format. Example: The capital of France is [Paris]" : 
                  "Enter your question here..."}
                className="question-input"
              />
            </div>

            {questionType === 'fillblanks' && question.blanks.length > 0 && (
              <div className="blanks-preview">
                <h4>Blanks Preview:</h4>
                {question.blanks.map((blank, index) => (
                  <div key={index} className="blank-preview">
                    <span className="blank-number">Blank {index + 1}:</span>
                    <span className="blank-text">{blank}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="options-container">
              {question.options.map((option, index) => (
                <div key={index} className="option-group">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={question.correctAnswer === index}
                    onChange={() => handleCorrectAnswerChange(index)}
                    className="correct-answer-radio"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="option-input"
                    disabled={questionType === 'truefalse' || questionType === 'fillblanks'}
                  />
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button 
                className={`action-button ${question.isPublished ? 'unpublish' : 'publish'}`}
                onClick={handlePublish}
              >
                {question.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <button className="action-button save" onClick={handleSave}>
                Save Question
              </button>
            </div>
          </div>
        )}

        {showQuestions && renderQuestions()}
      </div>
    </div>
  );
};

export default Exam; 