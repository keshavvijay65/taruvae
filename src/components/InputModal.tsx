'use client';

import { useState, useEffect } from 'react';

interface InputModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    type?: 'text' | 'number';
}

export default function InputModal({
    isOpen,
    title,
    message,
    placeholder = '',
    defaultValue = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'text',
}: InputModalProps) {
    const [inputValue, setInputValue] = useState(defaultValue);

    useEffect(() => {
        if (isOpen) {
            setInputValue(defaultValue);
        }
    }, [isOpen, defaultValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (inputValue.trim()) {
            onConfirm(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn border-2 border-gray-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                        {title}
                    </h3>
                    <button
                        onClick={onCancel}
                        className="text-white hover:text-gray-200 transition-colors text-2xl font-bold leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    {message && (
                        <p className="text-gray-700 mb-4 text-center">
                            {message}
                        </p>
                    )}
                    <div className="mb-6">
                        <input
                            type={type}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D5016] focus:border-[#2D5016] text-sm font-medium"
                            autoFocus
                        />
                    </div>

                    {/* Modal Footer */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!inputValue.trim()}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#2D5016] to-[#4A7C2A] text-white font-bold rounded-lg hover:from-[#4A7C2A] hover:to-[#2D5016] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-scaleIn {
                    animation: scaleIn 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}

