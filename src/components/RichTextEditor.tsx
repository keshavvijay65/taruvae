'use client';

import { useState, useEffect, useRef } from 'react';
import InputModal from './InputModal';
import ConfirmModal from './ConfirmModal';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write your content here...', className = '' }: RichTextEditorProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [editorContent, setEditorContent] = useState(value);
    const editorRef = useRef<HTMLDivElement>(null);
    const [showColorPicker, setShowColorPicker] = useState<'text' | 'bg' | null>(null);
    const [showFontSize, setShowFontSize] = useState(false);
    const [showFontFamily, setShowFontFamily] = useState(false);
    const [inputModal, setInputModal] = useState<{ isOpen: boolean; title: string; message: string; placeholder: string; defaultValue: string; type: 'text' | 'number'; onConfirm: (value: string) => void } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        setEditorContent(value);
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML;
        setEditorContent(html);
        onChange(html);
    };

    const execCommand = (command: string, value?: string | boolean) => {
        document.execCommand(command, false, value as string);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertTable = () => {
        setInputModal({
            isOpen: true,
            title: 'Table Rows',
            message: 'Enter number of rows:',
            placeholder: '3',
            defaultValue: '3',
            type: 'number',
            onConfirm: (rows) => {
                setInputModal({
                    isOpen: true,
                    title: 'Table Columns',
                    message: 'Enter number of columns:',
                    placeholder: '3',
                    defaultValue: '3',
                    type: 'number',
                    onConfirm: (cols) => {
                        if (rows && cols) {
                            let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
                            for (let i = 0; i < parseInt(rows); i++) {
                                tableHTML += '<tr>';
                                for (let j = 0; j < parseInt(cols); j++) {
                                    tableHTML += '<td style="padding: 8px; border: 1px solid #ddd;">&nbsp;</td>';
                                }
                                tableHTML += '</tr>';
                            }
                            tableHTML += '</table>';
                            execCommand('insertHTML', tableHTML);
                        }
                        setInputModal(null);
                    },
                });
            },
        });
    };

    const insertImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    const base64 = event.target.result;
                    execCommand('insertImage', base64);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const insertVideo = () => {
        // First show modal to choose between upload and URL
        setConfirmModal({
            isOpen: true,
            title: 'Video Insert',
            message: 'Click "Upload" to upload a video file, or "Cancel" and use the URL button to enter a video URL.',
            onConfirm: () => {
                setConfirmModal(null);
                // Upload video file
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'video/*';
                input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event: any) => {
                            const base64 = event.target.result;
                            const videoHTML = `<video controls style="max-width: 100%; height: auto; margin: 10px 0;"><source src="${base64}" type="${file.type}"></video>`;
                            execCommand('insertHTML', videoHTML);
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            },
        });
    };

    const insertVideoUrl = () => {
        setInputModal({
            isOpen: true,
            title: 'Video URL',
            message: 'Enter video URL (YouTube, Vimeo, or direct video link):',
            placeholder: 'https://youtube.com/watch?v=...',
            defaultValue: '',
            type: 'text',
            onConfirm: (url) => {
                if (url) {
                    // Check if it's a YouTube URL
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                        let videoId = '';
                        if (url.includes('youtube.com/watch?v=')) {
                            videoId = url.split('v=')[1].split('&')[0];
                        } else if (url.includes('youtu.be/')) {
                            videoId = url.split('youtu.be/')[1].split('?')[0];
                        }
                        if (videoId) {
                            const embedHTML = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width: 100%; margin: 10px 0;"></iframe>`;
                            execCommand('insertHTML', embedHTML);
                        }
                    } else if (url.includes('vimeo.com')) {
                        // Extract Vimeo video ID
                        const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
                        if (videoId) {
                            const embedHTML = `<iframe src="https://player.vimeo.com/video/${videoId}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="max-width: 100%; margin: 10px 0;"></iframe>`;
                            execCommand('insertHTML', embedHTML);
                        }
                    } else {
                        // Direct video URL
                        const videoHTML = `<video controls style="max-width: 100%; height: auto; margin: 10px 0;"><source src="${url}"></video>`;
                        execCommand('insertHTML', videoHTML);
                    }
                }
                setInputModal(null);
            },
        });
    };

    const setColor = (color: string, type: 'foreColor' | 'backColor') => {
        execCommand(type, color);
        setShowColorPicker(null);
    };

    const setFontSize = (size: string) => {
        execCommand('fontSize', size);
        setShowFontSize(false);
    };

    const setFontFamily = (font: string) => {
        execCommand('fontName', font);
        setShowFontFamily(false);
    };

    const colors = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0', '#808080',
        '#FFA500', '#FFC0CB', '#A52A2A', '#FFD700', '#4B0082', '#9400D3', '#00CED1', '#32CD32'
    ];

    const fontSizes = ['1', '2', '3', '4', '5', '6', '7'];
    const fontFamilies = [
        'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 
        'Comic Sans MS', 'Impact', 'Lucida Console', 'Tahoma', 'Trebuchet MS'
    ];

    if (!isMounted) {
        return (
            <div className={`h-[300px] border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center ${className}`}>
                <p className="text-gray-500">Loading editor...</p>
            </div>
        );
    }

    return (
        <div className={`rich-text-editor-wrapper ${className}`}>
            <style jsx global>{`
                .rich-text-editor-wrapper {
                    background: white;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    overflow: hidden;
                }
                .rich-text-editor-wrapper .toolbar {
                    background: linear-gradient(to bottom, #ffffff, #f8f9fa);
                    border: none;
                    border-bottom: 2px solid #e5e7eb;
                    padding: 1rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    align-items: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .rich-text-editor-wrapper .toolbar button {
                    padding: 0.625rem 0.875rem;
                    border: 1.5px solid #e5e7eb;
                    background: linear-gradient(to bottom, #ffffff, #fafafa);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-width: 40px;
                    height: 40px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    color: #374151;
                }
                .rich-text-editor-wrapper .toolbar button:hover {
                    background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
                    border-color: #2D5016;
                    color: #2D5016;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(45, 80, 22, 0.15);
                }
                .rich-text-editor-wrapper .toolbar button:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                .rich-text-editor-wrapper .toolbar button.active {
                    background: linear-gradient(to bottom, #2D5016, #1a3a0f);
                    color: white;
                    border-color: #2D5016;
                    box-shadow: 0 4px 12px rgba(45, 80, 22, 0.3);
                }
                .rich-text-editor-wrapper .toolbar .divider {
                    width: 1.5px;
                    height: 28px;
                    background: linear-gradient(to bottom, transparent, #d1d5db, transparent);
                    margin: 0 0.25rem;
                }
                .rich-text-editor-wrapper .toolbar select {
                    padding: 0.625rem 0.875rem;
                    border: 1.5px solid #e5e7eb;
                    background: linear-gradient(to bottom, #ffffff, #fafafa);
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    font-weight: 500;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    transition: all 0.3s;
                }
                .rich-text-editor-wrapper .toolbar select:hover {
                    border-color: #2D5016;
                    box-shadow: 0 4px 8px rgba(45, 80, 22, 0.15);
                }
                .rich-text-editor-wrapper .toolbar .color-picker {
                    position: absolute;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.75rem;
                    padding: 1rem;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    z-index: 1000;
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 0.625rem;
                    margin-top: 0.5rem;
                    backdrop-filter: blur(10px);
                }
                .rich-text-editor-wrapper .toolbar .color-item {
                    width: 32px;
                    height: 32px;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .rich-text-editor-wrapper .toolbar .color-item:hover {
                    transform: scale(1.15);
                    border-color: #2D5016;
                    box-shadow: 0 4px 8px rgba(45, 80, 22, 0.3);
                }
                .rich-text-editor-wrapper .toolbar .dropdown {
                    position: relative;
                }
                .rich-text-editor-wrapper .toolbar .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.75rem;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                    z-index: 1000;
                    margin-top: 0.5rem;
                    min-width: 180px;
                    max-height: 250px;
                    overflow-y: auto;
                    backdrop-filter: blur(10px);
                }
                .rich-text-editor-wrapper .toolbar .dropdown-item {
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid #f3f4f6;
                }
                .rich-text-editor-wrapper .toolbar .dropdown-item:last-child {
                    border-bottom: none;
                }
                .rich-text-editor-wrapper .toolbar .dropdown-item:hover {
                    background: linear-gradient(to right, #F5F1EB, #ffffff);
                    color: #2D5016;
                    font-weight: 600;
                }
                .rich-text-editor-wrapper .editor {
                    min-height: 350px;
                    padding: 1.5rem;
                    border: none;
                    outline: none;
                    font-family: var(--font-inter), sans-serif;
                    font-size: 1rem;
                    line-height: 1.8;
                    overflow-y: auto;
                    background: white;
                }
                .rich-text-editor-wrapper .editor:focus {
                    outline: none;
                }
                .rich-text-editor-wrapper .editor:empty::before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    font-style: italic;
                }
                .rich-text-editor-wrapper .editor table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
                .rich-text-editor-wrapper .editor table td {
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    background: white;
                }
                .rich-text-editor-wrapper .editor table tr:nth-child(even) td {
                    background: #f9fafb;
                }
                .rich-text-editor-wrapper .editor img {
                    max-width: 100%;
                    height: auto;
                    margin: 15px 0;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .rich-text-editor-wrapper .editor video {
                    max-width: 100%;
                    height: auto;
                    margin: 15px 0;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .rich-text-editor-wrapper .editor iframe {
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    margin: 15px 0;
                }
            `}</style>
            
            {/* Toolbar */}
            <div className="toolbar">
                {/* Undo/Redo */}
                <button type="button" onClick={() => execCommand('undo')} title="Undo">↶</button>
                <button type="button" onClick={() => execCommand('redo')} title="Redo">↷</button>
                <div className="divider"></div>

                {/* Font Family */}
                <div className="dropdown">
                    <button type="button" onClick={() => setShowFontFamily(!showFontFamily)} title="Font Family">
                        Font
                    </button>
                    {showFontFamily && (
                        <div className="dropdown-menu">
                            {fontFamilies.map(font => (
                                <div key={font} className="dropdown-item" onClick={() => setFontFamily(font)} style={{ fontFamily: font }}>
                                    {font}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Font Size */}
                <div className="dropdown">
                    <button type="button" onClick={() => setShowFontSize(!showFontSize)} title="Font Size">
                        Size
                    </button>
                    {showFontSize && (
                        <div className="dropdown-menu">
                            {fontSizes.map(size => (
                                <div key={size} className="dropdown-item" onClick={() => setFontSize(size)}>
                                    {size}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="divider"></div>

                {/* Text Formatting */}
                <button type="button" onClick={() => execCommand('bold')} title="Bold">
                    <strong>B</strong>
                </button>
                <button type="button" onClick={() => execCommand('italic')} title="Italic">
                    <em>I</em>
                </button>
                <button type="button" onClick={() => execCommand('underline')} title="Underline">
                    <u>U</u>
                </button>
                <button type="button" onClick={() => execCommand('strikeThrough')} title="Strikethrough">
                    <s>S</s>
                </button>
                <div className="divider"></div>

                {/* Subscript/Superscript */}
                <button type="button" onClick={() => execCommand('subscript')} title="Subscript">X₂</button>
                <button type="button" onClick={() => execCommand('superscript')} title="Superscript">X²</button>
                <div className="divider"></div>

                {/* Text Color */}
                <div className="dropdown">
                    <button type="button" onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')} title="Text Color">
                        <span style={{ color: '#FF0000' }}>A</span>
                    </button>
                    {showColorPicker === 'text' && (
                        <div className="color-picker">
                            {colors.map(color => (
                                <div
                                    key={color}
                                    className="color-item"
                                    style={{ backgroundColor: color }}
                                    onClick={() => setColor(color, 'foreColor')}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Background Color */}
                <div className="dropdown">
                    <button type="button" onClick={() => setShowColorPicker(showColorPicker === 'bg' ? null : 'bg')} title="Background Color">
                        <span style={{ backgroundColor: '#FFFF00' }}>A</span>
                    </button>
                    {showColorPicker === 'bg' && (
                        <div className="color-picker">
                            {colors.map(color => (
                                <div
                                    key={color}
                                    className="color-item"
                                    style={{ backgroundColor: color }}
                                    onClick={() => setColor(color, 'backColor')}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="divider"></div>

                {/* Headings */}
                <button type="button" onClick={() => execCommand('formatBlock', 'h1')} title="Heading 1">H1</button>
                <button type="button" onClick={() => execCommand('formatBlock', 'h2')} title="Heading 2">H2</button>
                <button type="button" onClick={() => execCommand('formatBlock', 'h3')} title="Heading 3">H3</button>
                <button type="button" onClick={() => execCommand('formatBlock', 'h4')} title="Heading 4">H4</button>
                <div className="divider"></div>

                {/* Lists */}
                <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">•</button>
                <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List">1.</button>
                <div className="divider"></div>

                {/* Indentation */}
                <button type="button" onClick={() => execCommand('outdent')} title="Decrease Indent">⬅</button>
                <button type="button" onClick={() => execCommand('indent')} title="Increase Indent">➡</button>
                <div className="divider"></div>

                {/* Alignment */}
                <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left">⬅</button>
                <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center">⬌</button>
                <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right">➡</button>
                <button type="button" onClick={() => execCommand('justifyFull')} title="Justify">⬌</button>
                <div className="divider"></div>

                {/* Special Elements */}
                <button type="button" onClick={() => {
                    setInputModal({
                        isOpen: true,
                        title: 'Insert Link',
                        message: 'Enter URL:',
                        placeholder: 'https://example.com',
                        defaultValue: '',
                        type: 'text',
                        onConfirm: (url) => {
                            if (url) {
                                execCommand('createLink', url);
                            }
                            setInputModal(null);
                        },
                    });
                }} title="Insert Link">🔗</button>
                <button type="button" onClick={insertImage} title="Upload Image">🖼️</button>
                <button type="button" onClick={insertVideo} title="Upload Video">🎥</button>
                <button type="button" onClick={insertTable} title="Insert Table">⊞</button>
                <button type="button" onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote">"</button>
                <button type="button" onClick={() => execCommand('formatBlock', 'pre')} title="Code Block">{ }</button>
                <div className="divider"></div>

                {/* Clear Formatting */}
                <button type="button" onClick={() => execCommand('removeFormat')} title="Clear Formatting">✕</button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                id="rich-text-editor"
                className="editor"
                contentEditable
                data-placeholder={placeholder}
                onInput={handleInput}
                dangerouslySetInnerHTML={{ __html: editorContent }}
                suppressContentEditableWarning
            />

            {/* Input Modal */}
            {inputModal && (
                <InputModal
                    isOpen={inputModal.isOpen}
                    title={inputModal.title}
                    message={inputModal.message}
                    placeholder={inputModal.placeholder}
                    defaultValue={inputModal.defaultValue}
                    type={inputModal.type}
                    onConfirm={(value) => {
                        inputModal.onConfirm(value);
                        setInputModal(null);
                    }}
                    onCancel={() => setInputModal(null)}
                />
            )}

            {/* Confirm Modal */}
            {confirmModal && (
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(null);
                    }}
                    onCancel={() => {
                        // If canceling video upload, show URL input
                        if (confirmModal.title === 'Video Insert') {
                            setConfirmModal(null);
                            insertVideoUrl();
                        } else {
                            setConfirmModal(null);
                        }
                    }}
                    confirmText="Upload"
                    cancelText="Enter URL"
                    type="info"
                />
            )}
        </div>
    );
}
