"use client";

import { ChangeEvent, FormEvent, KeyboardEvent, useState, ClipboardEvent } from "react";
import { Send, X, Image as ImageIcon } from "lucide-react";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onImagePaste?: (imageDataUrl: string) => void;
  onImageRemove?: () => void;
  pastedImage?: string | null;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  onImagePaste,
  onImageRemove,
  pastedImage,
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file && onImagePaste) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            onImagePaste(dataUrl);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative p-4 bg-white border-t border-neutral-200/60">
      <div className="relative max-w-4xl mx-auto">
        {pastedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={pastedImage}
              alt="Pasted"
              className="max-h-32 rounded-lg border border-neutral-200 shadow-sm"
            />
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Describe the React component you want to create... (or paste an image)"
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-14 py-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white transition-all placeholder:text-neutral-400 text-[15px] font-normal shadow-sm"
          rows={3}
        />
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !pastedImage)}
          className="absolute right-3 bottom-3 p-2.5 rounded-lg transition-all hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
        >
          <Send className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isLoading || (!input.trim() && !pastedImage) ? 'text-neutral-300' : 'text-blue-600'}`} />
        </button>
      </div>
    </form>
  );
}