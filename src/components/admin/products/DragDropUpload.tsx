'use client';

import { useState, useCallback } from 'react';

interface DragDropUploadProps {
    onFileSelect: (file: File) => void;
    currentImage?: string;
    isUploading?: boolean;
}

export default function DragDropUpload({ onFileSelect, currentImage, isUploading }: DragDropUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const imageFile = files.find(file => file.type.startsWith('image/'));

        if (imageFile) {
            handleFile(imageFile);
        }
    }, []);

    const handleFile = (file: File) => {
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Pass file to parent
        onFileSelect(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        // You might want to notify parent about removal
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Image
            </label>

            <div
                className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging
                    ? 'border-brand-forest bg-brand-50 scale-105'
                    : preview
                        ? 'border-gray-200 bg-gray-50'
                        : 'border-gray-300 hover:border-brand-forest hover:bg-brand-50/30'
                    }`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {preview ? (
                    // Preview State
                    <div className="relative group">
                        <div className="p-4">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full max-h-[400px] object-contain rounded-lg shadow-inner"
                            />
                        </div>

                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-3">
                                <label className="cursor-pointer bg-white text-brand-forest px-4 py-2 rounded-lg font-semibold hover:bg-brand-50 transition-colors flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Change
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileInput}
                                        disabled={isUploading}
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
                                    disabled={isUploading}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Remove
                                </button>
                            </div>
                        </div>

                        {/* Uploading overlay */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 rounded-xl flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mb-3"></div>
                                    <p className="font-semibold">Uploading...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Upload State
                    <label className="cursor-pointer block p-12">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileInput}
                            disabled={isUploading}
                        />

                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-brand-100 flex items-center justify-center">
                                <svg className="w-8 h-8 text-brand-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>

                            <p className="text-lg font-semibold text-gray-700 mb-2">
                                {isDragging ? 'Drop image here' : 'Drag & drop image here'}
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                                or click to browse
                            </p>
                            <p className="text-xs text-gray-400">
                                Supports: JPG, PNG, GIF (Max 5MB)
                            </p>
                        </div>
                    </label>
                )}
            </div>

            {/* Helper text */}
            <p className="mt-2 text-xs text-gray-500">
                💡 Images will be automatically compressed to 800x800px for faster loading
            </p>
        </div>
    );
}
