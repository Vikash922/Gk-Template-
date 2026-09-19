import React, { useState, useEffect } from 'react';
import { GKQuestion, CardStats } from './types/question';
import { CardDesignConfig } from './types/design';
import { REFERENCE_DESIGN } from './constants/referenceDesign';
import { isLegacyGhostSvg } from './utils/canvasRenderer';
import {
  getStoredQuestions,
  saveQuestionToStorage,
  deleteQuestionFromStorage,
  duplicateQuestionInStorage,
  saveAllQuestionsToStorage,
  getCardStats,
} from './services/storage';
import { Navbar, AppTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { VideoStudio } from './components/VideoStudio';
import { VideoEditor } from './video-editor';
import { VideoProject } from './video-editor/types';
import { generateTimelineFromQuestions } from './video-editor/engine/GKVideoGenerator';
import { CardPreview } from './components/CardPreview';
import { QuestionForm } from './components/QuestionForm';
import { ImageControls } from './components/ImageControls';
import { DesignControls } from './components/DesignControls';
import { CardLayoutControls } from './components/CardLayoutControls';
import { SavedQuestionCard } from './components/SavedQuestionCard';
import { TemplateManagementView } from './components/TemplateManagementView';
import { BatchGenerator } from './components/BatchGenerator';
import { SettingsView } from './components/SettingsView';
import { QuickQuestionModal } from './components/QuickQuestionModal';
import { AiImageModal } from './components/AiImageModal';
import { useToast } from './components/Toast';
import {
  Search,
  Plus,
  HelpCircle,
  Image as ImageIcon,
  Move,
  Palette,
  Download,
  Bookmark,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const { showToast } = useToast();
  const [currentTab, setCurrentTab] = useState<AppTab>('editor');
  const [designConfig, setDesignConfig] = useState<CardDesignConfig>({ ...REFERENCE_DESIGN });
  const [savedQuestions, setSavedQuestions] = useState<GKQuestion[]>([]);
  const [stats, setStats] = useState<CardStats>({ totalQuestions: 0, savedQuestions: 0, generatedCards: 0 });
  const [currentQuestion, setCurrentQuestion] = useState<GKQuestion>({
    id: 'q_default',
    questionNumber: 1,
    question: 'Which country is known as the Land of the Rising Sun?',
    optionA: 'Japan',
    optionB: 'Norway',
    optionC: 'New Zealand',
    optionD: 'Australia',
    correctAnswer: 'A',
    imageTopic: 'japan',
    imageMode: 'library',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  const [videoProject, setVideoProject] = useState<VideoProject | undefined>(undefined);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isAiImageModalOpen, setIsAiImageModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEditorSection, setActiveEditorSection] = useState<'question' | 'image' | 'layout' | 'design'>('question');
  const [editorApplyScope, setEditorApplyScope] = useState<'all' | 'single'>('single');

  const refreshData = () => {
    const list = getStoredQuestions();
    setSavedQuestions(list);
    setStats(getCardStats());
  };

  useEffect(() => {
    const stored = getStoredQuestions();
    let questionsChanged = false;
    const sanitizedQuestions = stored.map((q) => {
      if (q.customDesign?.templateImage && isLegacyGhostSvg(q.customDesign.templateImage)) {
        questionsChanged = true;
        const { templateImage, useTemplateImage, ...restCustom } = q.customDesign;
        return {
          ...q,
          customDesign: {
            ...restCustom,
            templateImage: '',
            useTemplateImage: false,
          },
        };
      }
      return q;
    });

    if (questionsChanged) {
      saveAllQuestionsToStorage(sanitizedQuestions);
    }
    setSavedQuestions(sanitizedQuestions);
    setStats(getCardStats());

    if (sanitizedQuestions.length > 0) {
      setCurrentQuestion(sanitizedQuestions[0]);
    }

    setDesignConfig((prev) => {
      if (prev.templateImage && isLegacyGhostSvg(prev.templateImage)) {
        return {
          ...prev,
          templateImage: '',
          useTemplateImage: false,
          templatePreprintedLetters: false,
        };
      }
      return prev;
    });

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/video-editor' || hash === '#video-editor') {
        setCurrentTab('video');
      }
    }
  }, []);

  const handleNewQuestion = () => {
    const nextNumber = savedQuestions.length + 1;
    const newQ: GKQuestion = {
      id: `q_${Date.now()}`,
      questionNumber: nextNumber,
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      imageMode: 'library',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentQuestion(newQ);
    setActiveEditorSection('question');
    setCurrentTab('editor');
    showToast('Ready to create new card', 'info');
  };

  const handleSaveCurrentQuestion = () => {
    const updatedList = saveQuestionToStorage(currentQuestion);
    setSavedQuestions(updatedList);
    setStats(getCardStats());
    showToast('✓ Card saved successfully', 'success');
  };

  const handleDuplicateCurrent = (id?: string) => {
    const targetId = id || currentQuestion.id;
    const dup = duplicateQuestionInStorage(targetId);
    if (dup) {
      setCurrentQuestion(dup);
      refreshData();
      setCurrentTab('editor');
      showToast('✓ Duplicate card created', 'success');
    }
  };

  const handleDeleteSaved = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      const updated = deleteQuestionFromStorage(id);
      setSavedQuestions(updated);
      setStats(getCardStats());
      if (currentQuestion.id === id && updated.length > 0) {
        setCurrentQuestion(updated[0]);
      }
      showToast('Card removed', 'info');
    }
  };

  const handleEditSaved = (q: GKQuestion) => {
    setCurrentQuestion(q);
    setCurrentTab('editor');
  };

  const handleUpdateDesign = (updated: Partial<CardDesignConfig>) => {
    setDesignConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleEditorLayoutUpdate = (updated: Partial<CardDesignConfig>) => {
    if (editorApplyScope === 'all') {
      setDesignConfig((prev) => ({ ...prev, ...updated }));
    } else {
      setCurrentQuestion((prev) => ({
        ...prev,
        customDesign: {
          ...(prev.customDesign || {}),
          ...updated,
        },
        updatedAt: Date.now(),
      }));
    }
  };

  const handleApplyEditorLayoutToAll = () => {
    const currentMerged = currentQuestion.customDesign
      ? { ...designConfig, ...currentQuestion.customDesign }
      : designConfig;
    setDesignConfig(currentMerged);
    const updatedList = savedQuestions.map((q) => ({
      ...q,
      customDesign: undefined,
    }));
    setSavedQuestions(updatedList);
    saveAllQuestionsToStorage(updatedList);
    setCurrentQuestion((prev) => ({
      ...prev,
      customDesign: undefined,
      updatedAt: Date.now(),
    }));
    showToast('Card layout applied to all cards!', 'success');
  };

  const handleResetEditorCardCustomLayout = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      customDesign: undefined,
      updatedAt: Date.now(),
    }));
    showToast('Card customization reset to default', 'info');
  };

  const handleApplyImageToAllQuestions = (imageDataUri: string, topic?: string) => {
    const updatedList = savedQuestions.map((q) => ({
      ...q,
      image: imageDataUri,
      imageTopic: topic || q.imageTopic,
      imageMode: 'upload' as const,
      updatedAt: Date.now(),
    }));
    setSavedQuestions(updatedList);
    saveAllQuestionsToStorage(updatedList);
    setCurrentQuestion((prev) => ({
      ...prev,
      image: imageDataUri,
      imageTopic: topic || prev.imageTopic,
      imageMode: 'upload',
      updatedAt: Date.now(),
    }));
    showToast(`Image set for all ${updatedList.length} saved cards!`, 'success');
  };

  const filteredQuestions = savedQuestions.filter((q) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const qNum = String(q.questionNumber || '');
    return (
      q.question.toLowerCase().includes(query) ||
      qNum.includes(query) ||
      q.optionA.toLowerCase().includes(query) ||
      q.optionB.toLowerCase().includes(query) ||
      q.optionC.toLowerCase().includes(query) ||
      q.optionD.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 text-slate-900 font-sans selection:bg-indigo-500/20 selection:text-indigo-900 ${currentTab === 'video' ? 'pb-0' : 'pb-20 md:pb-8'} relative`}>
      {/* Premium subtle background glow */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-100/40 to-transparent pointer-events-none -z-10" />
      {/* Compact, Clean, Friendly Header (Hidden during Video Editor for full-screen workstation view) */}
      {currentTab !== 'video' && (
        <Navbar
          currentTab={currentTab}
          onChangeTab={setCurrentTab}
          onNewQuestion={handleNewQuestion}
          savedCount={savedQuestions.length}
          onOpenAiQuestions={() => setIsAiModalOpen(true)}
          onOpenAiImageStudio={() => setIsAiImageModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${currentTab === 'video' ? 'p-0 max-w-none' : 'max-w-7xl px-4 sm:px-6 pt-5 sm:pt-6'}`}>
        {/* TAB: DASHBOARD (HOME) */}
        {currentTab === 'home' && (
          <DashboardView
            stats={stats}
            savedQuestions={savedQuestions}
            recentQuestions={savedQuestions}
            designConfig={designConfig}
            onNavigate={(tab) => setCurrentTab(tab as any)}
            onCreateNewCard={handleNewQuestion}
            onOpenEditor={() => setCurrentTab('editor')}
            onOpenSaved={() => setCurrentTab('saved')}
            onOpenBatch={() => setCurrentTab('batch')}
            onOpenTemplates={() => setCurrentTab('templates')}
            onEditQuestion={handleEditSaved}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
          />
        )}

        {/* TAB: CARD EDITOR */}
        {currentTab === 'editor' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start relative">
            {/* Right Column: Sticky Live Preview (5 cols on lg). On mobile, order first! */}
            <div className="order-1 lg:order-2 lg:col-span-5 sticky top-16 lg:top-24 flex flex-col gap-4 w-full z-30">
              <div className="bg-white/60 backdrop-blur-xl border border-white/50 p-2 sm:p-4 rounded-b-2xl shadow-sm">
                <CardPreview
                  question={currentQuestion}
                  designConfig={
                    currentQuestion.customDesign
                      ? { ...designConfig, ...currentQuestion.customDesign }
                      : designConfig
                  }
                  onSave={handleSaveCurrentQuestion}
                  onDuplicate={() => handleDuplicateCurrent()}
                  onUpdateDesign={handleEditorLayoutUpdate}
                  onOpenPositionControls={() => setActiveEditorSection('layout')}
                />
              </div>
            </div>

            {/* Left Column: Form Controls (7 cols on lg). On mobile, order second. */}
            <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col gap-4 w-full">
              <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl p-4 sm:p-6 shadow-sm">
                {/* Ultra Minimal Section Switcher Navigation */}
                <div className="flex items-center gap-6 border-b border-slate-200/60 overflow-x-auto no-scrollbar pb-px">
                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('question')}
                    className={`py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                      activeEditorSection === 'question'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Question & Options</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('image')}
                    className={`py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                      activeEditorSection === 'image'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('layout')}
                    className={`py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                      activeEditorSection === 'layout'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Move className="w-4 h-4" />
                    <span>Position</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveEditorSection('design')}
                    className={`py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                      activeEditorSection === 'design'
                        ? 'border-slate-900 text-slate-900'
                        : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span>Theme</span>
                  </button>
                </div>

                <div className="mt-6">
                  {/* Active Section Content */}
                  {activeEditorSection === 'question' && (
                    <QuestionForm
                      question={currentQuestion}
                      onChange={setCurrentQuestion}
                      onOpenAiModal={() => setIsAiModalOpen(true)}
                    />
                  )}

                  {activeEditorSection === 'image' && (
                    <ImageControls
                      question={currentQuestion}
                      designConfig={
                        currentQuestion.customDesign
                          ? { ...designConfig, ...currentQuestion.customDesign }
                          : designConfig
                      }
                      onUpdateQuestion={setCurrentQuestion}
                      onUpdateDesign={handleEditorLayoutUpdate}
                      onApplyImageToAllQuestions={handleApplyImageToAllQuestions}
                    />
                  )}

                  {activeEditorSection === 'layout' && (
                    <CardLayoutControls
                      designConfig={
                        currentQuestion.customDesign
                          ? { ...designConfig, ...currentQuestion.customDesign }
                          : designConfig
                      }
                      applyMode={editorApplyScope}
                      onSetApplyMode={setEditorApplyScope}
                      onUpdateDesign={handleEditorLayoutUpdate}
                      onApplyCurrentToAll={handleApplyEditorLayoutToAll}
                      onResetCardCustomDesign={handleResetEditorCardCustomLayout}
                      currentCard={currentQuestion}
                      totalCardsCount={savedQuestions.length || 1}
                      currentCardNumber={currentQuestion.questionNumber}
                    />
                  )}

                  {activeEditorSection === 'design' && (
                    <DesignControls
                      config={
                        currentQuestion.customDesign
                          ? { ...designConfig, ...currentQuestion.customDesign }
                          : designConfig
                      }
                      onChange={handleEditorLayoutUpdate}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SAVED QUESTIONS */}
        {currentTab === 'saved' && (
          <div className="flex flex-col gap-4 max-w-5xl mx-auto py-1 sm:py-2">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-emerald-600" />
                  Saved Cards Library
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {savedQuestions.length} questions in local storage. Click any card to edit.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or options..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs bg-white"
                />
              </div>
            </div>

            {/* Questions Grid */}
            {filteredQuestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q) => (
                  <SavedQuestionCard
                    key={q.id}
                    question={q}
                    designConfig={designConfig}
                    onEdit={handleEditSaved}
                    onDuplicate={handleDuplicateCurrent}
                    onDelete={handleDeleteSaved}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery ? 'Try adjusting your search query' : 'Your saved card library is currently empty'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNewQuestion}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Card</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: TEMPLATES */}
        {currentTab === 'templates' && (
          <TemplateManagementView
            designConfig={designConfig}
            onUpdateDesign={handleUpdateDesign}
          />
        )}

        {/* TAB: BATCH GENERATOR */}
        {currentTab === 'batch' && (
          <div className="max-w-6xl mx-auto py-2 sm:py-4">
            <BatchGenerator
              designConfig={designConfig}
              onUpdateDesignConfig={setDesignConfig}
              onQuestionsAdded={refreshData}
              onEditInSingleEditor={(q) => {
                setCurrentQuestion(q);
                setActiveEditorSection('question');
                setCurrentTab('editor');
              }}
              onOpenInVideoEditor={(batchQuestions) => {
                const generated = generateTimelineFromQuestions(batchQuestions, {
                  aspectRatio: '16:9',
                  stylePreset: 'reference',
                  readTime: 2.5,
                  optionIntervalTime: 0.75,
                  timerTime: 5.0,
                  revealTime: 2.5,
                  enableVoiceover: true,
                  voiceoverSpeed: 1.0,
                  enableSfx: true,
                });
                setVideoProject(generated);
                setCurrentTab('video');
                showToast(`🎬 Created 16:9 Video Episode with ${batchQuestions.length} questions!`, 'success');
              }}
            />
          </div>
        )}

        {/* TAB: VIDEO EDITOR */}
        {currentTab === 'video' && (
          <div className="fixed inset-0 z-50 w-full h-full bg-[#090b10]">
            <VideoEditor
              key={videoProject?.id || 'video_editor'}
              initialProject={videoProject}
              onBack={() => setCurrentTab('home')}
            />
          </div>
        )}

        {/* TAB: SETTINGS */}
        {currentTab === 'settings' && (
          <SettingsView
            stats={stats}
            onRefreshData={refreshData}
          />
        )}
      </main>

      {/* Quick Question AI Generator Modal */}
      <QuickQuestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentCount={savedQuestions.length}
        onSelectQuestion={(q) => {
          setCurrentQuestion(q);
          setCurrentTab('editor');
          showToast('Question loaded into editor', 'success');
        }}
        onAppendAll={(newQuestions) => {
          newQuestions.forEach((q) => saveQuestionToStorage(q));
          refreshData();
          if (newQuestions.length > 0) {
            setCurrentQuestion(newQuestions[0]);
            setCurrentTab('editor');
          }
          showToast(`✓ Added ${newQuestions.length} new questions`, 'success');
        }}
      />

      {/* AI Image Studio Clipart Generator Modal */}
      <AiImageModal
        isOpen={isAiImageModalOpen}
        onClose={() => setIsAiImageModalOpen(false)}
        onApplyImage={(imageUrl, topicName) => {
          setCurrentQuestion((prev) => ({
            ...prev,
            image: imageUrl,
            imageTopic: topicName,
            imageMode: 'ai',
            updatedAt: Date.now(),
          }));
          setActiveEditorSection('image');
          showToast('Illustration applied to card!', 'success');
        }}
        initialPrompt={currentQuestion.imageTopic || currentQuestion.question.slice(0, 35)}
      />
    </div>
  );
}
