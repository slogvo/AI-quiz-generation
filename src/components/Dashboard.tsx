import React, { useState } from 'react';
import { Course } from '../types';
import { 
  LayoutDashboard, 
  Library, 
  Settings, 
  Plus, 
  UploadCloud, 
  Grid, 
  List, 
  MoreVertical, 
  BookOpen, 
  Trash2,
  ExternalLink
} from 'lucide-react';

interface DashboardProps {
  courses: Course[];
  onStartNewCourse: () => void;
  onSelectCourse: (course: Course) => void;
  onDeleteCourse: (id: string, e: React.MouseEvent) => void;
}

export default function Dashboard({ 
  courses, 
  onStartNewCourse, 
  onSelectCourse, 
  onDeleteCourse 
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'settings'>('dashboard');

  return (
    <div className="flex w-full h-full" id="dashboard-viewport">
      {/* Sidebar navigation */}
      <aside className="w-[240px] border-r border-black bg-[#f4f5f6] flex flex-col h-full shrink-0" id="sidebar">
        {/* Header/Logo Inside Sidebar */}
        <div className="h-16 border-b border-black flex items-center px-6 shrink-0 bg-white" id="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 text-[#0ac75f] flex items-center justify-center">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h2 className="text-[#0f1115] text-xl font-bold tracking-tight">AI Quiz Gen</h2>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1" id="sidebar-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-left font-medium transition-colors border w-full cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white border-black text-[#0f1115]'
                : 'border-transparent text-[#8a8f98] hover:bg-white hover:border-black hover:text-[#0f1115]'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#0ac75f]' : ''}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('courses');
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-left font-medium transition-colors border w-full cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-white border-black text-[#0f1115]'
                : 'border-transparent text-[#8a8f98] hover:bg-white hover:border-black hover:text-[#0f1115]'
            }`}
          >
            <Library className={`w-5 h-5 ${activeTab === 'courses' ? 'text-[#0ac75f]' : ''}`} />
            <span>My Courses</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-left font-medium transition-colors border w-full cursor-pointer mt-auto ${
              activeTab === 'settings'
                ? 'bg-white border-black text-[#0f1115]'
                : 'border-transparent text-[#8a8f98] hover:bg-white hover:border-black hover:text-[#0f1115]'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden" id="main-content-pane">
        {/* Global Toolbar Header */}
        <header className="h-16 border-b border-black flex items-center justify-between px-8 shrink-0 bg-white" id="header-toolbar">
          <h1 className="text-xl font-bold">
            {activeTab === 'dashboard' && 'Course Overview'}
            {activeTab === 'courses' && 'My Active Courses'}
            {activeTab === 'settings' && 'Applet Settings'}
          </h1>
          <button
            onClick={onStartNewCourse}
            className="flex items-center justify-center rounded px-5 h-9 bg-[#0ac75f] text-black text-sm font-bold border border-black hover:bg-[#00e066] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] active:translate-x-[2px] cursor-pointer"
          >
            New Course
          </button>
        </header>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8 w-full max-w-[1200px] mx-auto" id="scrollable-workspace">
          {activeTab === 'dashboard' && (
            <>
              {/* Hero Dropzone Card */}
              <div
                onClick={onStartNewCourse}
                className="w-full border-2 border-dashed border-[#8a8f98] hover:border-[#0ac75f] bg-[#f4f5f6]/50 hover:bg-[#0ac75f]/5 rounded-lg flex flex-col items-center justify-center py-16 px-6 mb-12 transition-all cursor-pointer group"
                id="hero-dropzone"
              >
                <div className="bg-white p-4 rounded-full border border-black mb-4 group-hover:scale-105 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <UploadCloud className="w-8 h-8 text-[#0ac75f] stroke-[2.2]" />
                </div>
                <p className="text-lg font-bold text-[#0f1115] mb-1">Start a new course</p>
                <p className="text-sm text-[#8a8f98] font-medium mb-6">Drag a syllabus or PDF here to instantly generate your structure</p>
                <button
                  className="flex items-center justify-center rounded px-4 h-9 bg-white text-[#0f1115] text-sm font-bold border border-black hover:border-[#0ac75f] hover:text-[#0ac75f] transition-all cursor-pointer"
                >
                  Browse Files
                </button>
              </div>

              {/* Course Grid Header Controls */}
              <div className="mb-6 flex items-center justify-between" id="recent-courses-header">
                <h2 className="text-lg font-bold">Recent Courses</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1 rounded border transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'border-black text-[#0f1115]' : 'border-transparent text-[#8a8f98] hover:text-[#0f1115]'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1 rounded border transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'border-black text-[#0f1115]' : 'border-transparent text-[#8a8f98] hover:text-[#0f1115]'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-gray-500 font-medium">No courses created yet. Click "New Course" above to build your first AI Course!</p>
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid View Style */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courses-grid">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse(course)}
                      className="group bg-white border border-black rounded hover:border-[#0ac75f] p-5 flex flex-col h-[185px] cursor-pointer transition-colors relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-auto">
                        <div className="pr-4">
                          <h3 className="font-bold text-[#0f1115] line-clamp-2 leading-snug group-hover:text-[#0ac75f] transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[#8a8f98] mt-1 font-medium">{course.updatedAt}</p>
                        </div>
                        <button
                          onClick={(e) => onDeleteCourse(course.id, e)}
                          title="Delete course"
                          className="text-[#8a8f98] hover:text-red-500 hover:scale-110 p-1 rounded transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-[#0f1115]">
                            {course.modules.length} Modules
                          </span>
                          <span className="text-xs font-bold text-[#0ac75f]">
                            {course.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-[#f4f5f6] h-2 rounded-full overflow-hidden border border-black/10">
                          <div
                            className="bg-[#0ac75f] h-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Loading State Mockup from screen 4 */}
                  <div className="bg-white border border-black rounded p-5 flex flex-col h-[185px] opacity-75 cursor-not-allowed">
                    <div className="flex justify-between items-start mb-auto w-full gap-4">
                      <div className="flex-1">
                        <div className="h-5 bg-[#f4f5f6] rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-[#f4f5f6] rounded w-1/2 mb-3 animate-pulse"></div>
                        <div className="h-3 bg-[#f4f5f6] rounded w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="mt-4 w-full">
                      <div className="flex justify-between items-end mb-2">
                        <div className="h-3 bg-[#f4f5f6] rounded w-16 animate-pulse"></div>
                        <div className="h-3 bg-[#f4f5f6] rounded w-8 animate-pulse"></div>
                      </div>
                      <div className="w-full bg-[#f4f5f6] h-1.5 rounded-full overflow-hidden animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* List View Style */
                <div className="flex flex-col gap-3" id="courses-list">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse(course)}
                      className="group bg-white border border-black rounded hover:border-[#0ac75f] p-4 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="font-bold text-[#0f1115] truncate group-hover:text-[#0ac75f] transition-all">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[#8a8f98] font-medium">{course.updatedAt} • {course.modules.length} Modules</p>
                      </div>

                      <div className="w-48 shrink-0 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-bold text-[#8a8f98]">Progress</span>
                            <span className="text-[10px] font-bold text-[#0ac75f]">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-[#f4f5f6] h-1.5 rounded-full overflow-hidden border border-black/10">
                            <div
                              className="bg-[#0ac75f] h-full"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => onDeleteCourse(course.id, e)}
                          title="Delete course"
                          className="text-[#8a8f98] hover:text-red-500 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4 mb-2">
                <h2 className="text-lg font-bold">All Curriculum Items ({courses.length})</h2>
              </div>
              {courses.length === 0 ? (
                <p className="text-gray-500 text-center py-12">No courses registered.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <div
                      key={course.id}
                      onClick={() => onSelectCourse(course)}
                      className="p-5 border border-black rounded hover:border-[#0ac75f] cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between font-bold text-gray-900 mb-2">
                        <h3 className="line-clamp-1">{course.title}</h3>
                        <span className="text-xs bg-[#0ac75f] text-black px-2 py-0.5 rounded-full font-semibold">{course.progress}% Completed</span>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description || "No description provided."}</p>
                      <div className="text-xs text-[#8a8f98] font-mono">Last modified: {course.updatedAt}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-[#f4f5f6]/50 border border-black rounded-lg p-6 space-y-6" id="settings-view">
              <h2 className="text-xl font-bold border-b border-black/10 pb-3">AI Quiz Generator Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Server API Key Status</label>
                  <p className="text-xs text-[#8a8f98] mb-2">Managed in the Settings &gt; Secrets panel inside Google AI Studio. This key remains securely hidden from client-side bundle code.</p>
                  <div className="h-10 bg-white border border-black rounded flex items-center px-3 justify-between">
                    <span className="text-sm text-gray-800 font-mono">GEMINI_API_KEY</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Interactive Features Enabled</label>
                  <ul className="text-xs text-gray-600 list-disc list-inside space-y-1 bg-white p-3 border border-black/10 rounded">
                    <li>Dynamic structured curriculum parsing via <strong>gemini-3.5-flash</strong>.</li>
                    <li>Surgical question re-writing (Nuance leveling, Simpler, Grammar fix).</li>
                    <li>Automatic fallback mockup system for local environments if API keys are inactive.</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-black/10 flex justify-between items-center">
                  <div className="text-xs text-[#8a8f98]">
                    App Version 1.0.4 • Powered by Gemini AI
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="h-9 px-4 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
