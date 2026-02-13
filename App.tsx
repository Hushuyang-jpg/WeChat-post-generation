import React, { useState, useCallback } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { generateArticleText, generateImage } from './services/geminiService';
import { parseMarkdownToWeChatHtml } from './utils/markdownProcessor';
import { ArticleData, StyleKey } from './types';

const App: React.FC = () => {
  const [topic, setTopic] = useState("冬天吃肉，怎么吃才能真正暖身又不长胖？");
  const [styleKey, setStyleKey] = useState<StyleKey>("中医科普风");
  const [wordCount, setWordCount] = useState(1750);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [articleData, setArticleData] = useState<ArticleData | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setArticleData(null); // Clear previous

    try {
      // 1. Generate Text
      setStatusMessage(`🖋️ Creating deep content with ${styleKey} persona...`);
      const rawMarkdown = await generateArticleText(topic, styleKey, wordCount);

      // --- NEW LOGIC: Extract Custom Cover Prompt ---
      let coverPrompt = `Cinematic photography related to ${topic}, contemporary Chinese lifestyle, natural lighting.`;
      let contentMarkdown = rawMarkdown;

      // Try to find the specific ((COVER_IMG: ...)) tag
      const coverRegex = /\(\(COVER_IMG:\s*(.*?)\)\)/;
      const coverMatch = rawMarkdown.match(coverRegex);
      
      if (coverMatch) {
        // Use the LLM-generated specific cover description
        coverPrompt = coverMatch[1].trim();
        // Remove this tag from the content so it doesn't show up in the body
        contentMarkdown = rawMarkdown.replace(coverMatch[0], "").trim();
      }
      // ----------------------------------------------

      // 2. Identify Body Image Prompts (from the cleaned contentMarkdown)
      const imageRegex = /\(\(IMG:\s*(.*?)\)\)/g;
      const prompts: string[] = [];
      let match;
      while ((match = imageRegex.exec(contentMarkdown)) !== null) {
        // CRITICAL FIX: Trim the prompt immediately to match markdownProcessor logic
        const cleanPrompt = match[1].trim();
        if (cleanPrompt) {
          prompts.push(cleanPrompt);
        }
      }

      // 3. Generate Body Images (Sequential to avoid Rate Limits)
      setStatusMessage(`📸 Developing ${prompts.length} photorealistic images...`);
      const imageMap: Record<string, string> = {};
      
      // We process sequentially to be nice to the API rate limits (avoiding 429 errors)
      for (const [index, p] of prompts.entries()) {
        setStatusMessage(`📸 Developing image ${index + 1} of ${prompts.length}...`);
        
        // Skip duplicate prompts to save time, but keep map integrity
        if (imageMap[p]) continue;

        // Pass the styleKey here to customize image aesthetics
        const url = await generateImage(p, styleKey, false);
        imageMap[p] = url;
        
        // Add a small delay between requests
        if (index < prompts.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      // 4. Generate Cover Image (Using the extracted tailored prompt)
      setStatusMessage("🖼️ Shooting wide-format cinematic cover...");
      // Pass the styleKey here as well
      const coverUrl = await generateImage(coverPrompt, styleKey, true);

      // 5. Assemble HTML (Using the cleaned contentMarkdown)
      setStatusMessage("✨ Applying WeChat Official Account styling...");
      const finalHtml = parseMarkdownToWeChatHtml(contentMarkdown, imageMap);

      setArticleData({
        topic,
        style: styleKey,
        wordCount,
        content: finalHtml,
        coverUrl
      });

    } catch (error: any) {
      console.error("详细报错信息:", error);
      // 把真实的报错信息弹窗显示出来
      alert(`生成失败！\n阶段: ${statusMessage}\n错误详情: ${error.message || error}`);
    } finally {
      setIsGenerating(false);
      setStatusMessage("");
    }
  }, [topic, styleKey, wordCount]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2 rounded-lg shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
             </div>
             <h1 className="text-xl font-bold text-gray-800 tracking-tight">WeChat<span className="text-green-600">Gen</span></h1>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            AI-Powered Official Account Editor
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
          {/* Left Column: Config */}
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <ConfigPanel 
              topic={topic}
              setTopic={setTopic}
              styleKey={styleKey}
              setStyleKey={setStyleKey}
              wordCount={wordCount}
              setWordCount={setWordCount}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              statusMessage={statusMessage}
            />
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8 xl:col-span-9 h-full">
             <PreviewPanel 
               articleData={articleData} 
               isGenerating={isGenerating}
               statusMessage={statusMessage}
             />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;