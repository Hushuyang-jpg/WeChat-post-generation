import React, { useState } from 'react';
import { ArticleData } from '../types';
import { Copy, Check, Info } from 'lucide-react';

interface PreviewPanelProps {
  articleData: ArticleData | null;
  statusMessage?: string;
  isGenerating: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ articleData, statusMessage, isGenerating }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!articleData) return;

    try {
      // Create a Blob with the HTML content
      // We wrap it in a meta tag to ensure charset is handled if the clipboard reader is picky, 
      // though typically not strictly necessary for WeChat.
      const htmlBlob = new Blob([articleData.content], { type: 'text/html' });
      
      // We also provide a plain text fallback
      const textBlob = new Blob([articleData.content.replace(/<[^>]+>/g, '')], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Automatic copy failed. Please verify browser permissions.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative">
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
        <span className="text-sm font-medium opacity-90">WeChat Preview</span>
        
        {/* Copy Button */}
        <div className="flex items-center gap-2">
           {articleData && !isGenerating && (
             <button 
               onClick={handleCopy}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                 copied 
                   ? 'bg-green-500 text-white' 
                   : 'bg-white/10 hover:bg-white/20 text-white'
               }`}
             >
               {copied ? (
                 <>
                   <Check className="w-3.5 h-3.5" />
                   Copied
                 </>
               ) : (
                 <>
                   <Copy className="w-3.5 h-3.5" />
                   Copy HTML
                 </>
               )}
             </button>
           )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar relative bg-gray-100 p-4 sm:p-8">
        {!articleData && !isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
              <span className="text-4xl">📱</span>
            </div>
            <p className="text-lg font-medium">Ready to create</p>
            <p className="text-sm mt-2 max-w-xs">Enter a topic and select a style to generate a professional WeChat article.</p>
          </div>
        ) : null}

        {isGenerating && !articleData && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20 transition-all duration-500">
             <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
             <p className="text-blue-800 font-medium text-lg animate-pulse">{statusMessage}</p>
             <p className="text-gray-500 text-sm mt-2">This may take up to 60 seconds</p>
           </div>
        )}

        {articleData && (
          <div className="max-w-[677px] mx-auto bg-white min-h-full shadow-xl rounded-sm overflow-hidden animate-fade-in transition-opacity duration-700">
            {/* Header Image */}
            {articleData.coverUrl && (
              <div className="relative w-full aspect-[2.35/1] overflow-hidden bg-gray-100 group">
                <img 
                  src={articleData.coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white text-xs font-light tracking-wider uppercase opacity-80">Featured Cover</span>
                </div>
              </div>
            )}
            
            <div className="p-6 md:p-10">
               {/* Title Area Simulation */}
               <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{articleData.topic}</h1>
               <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                 <span className="text-blue-600 font-medium">Official Account</span>
                 <span>•</span>
                 <span>Just now</span>
               </div>

               {/* Note for User */}
               <div className="mb-6 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>
                    <strong>Tip:</strong> Use the "Copy HTML" button in the top right to paste into WeChat. 
                    Standard copy-paste may lose formatting. Base64 images may need manual re-uploading in WeChat editor.
                  </p>
               </div>

               {/* Content Injection */}
               <div 
                 className="wechat-content-body"
                 dangerouslySetInnerHTML={{ __html: articleData.content }}
               />
               
               {/* Footer Simulation */}
               <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                 <p className="text-gray-400 text-sm">Views 100k+ &nbsp;&nbsp; Like 8.8k</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};