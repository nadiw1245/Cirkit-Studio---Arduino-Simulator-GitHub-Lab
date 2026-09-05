import React, { useState } from 'react';
import { generateGitHubReadme } from '../data/curriculum';
import { 
  Star, 
  Github, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Rocket, 
  Globe, 
  BookOpen, 
  Share2, 
  X,
  ShieldCheck,
  Flame,
  Award
} from 'lucide-react';
import { playUiClick } from '../utils/audio';

interface GitHubShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  gitHubStars: number;
  hasStarred: boolean;
  onStarRepo: () => void;
  onShareLink: () => void;
}

export const GitHubShowcaseModal: React.FC<GitHubShowcaseModalProps> = ({
  isOpen,
  onClose,
  gitHubStars,
  hasStarred,
  onStarRepo,
  onShareLink
}) => {
  const [username, setUsername] = useState('nadiw');
  const [repoName, setRepoName] = useState('arduino-q-simulator');
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'readme' | 'ghpages' | 'starstrategy'>('readme');

  if (!isOpen) return null;

  const readmeMarkdown = generateGitHubReadme(repoName, username);

  const ghActionsWorkflow = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install & Build Simulator
        run: |
          npm ci
          npm run build

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(readmeMarkdown);
    setCopiedReadme(true);
    playUiClick();
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  const handleCopyWorkflow = () => {
    navigator.clipboard.writeText(ghActionsWorkflow);
    setCopiedWorkflow(true);
    playUiClick();
    setTimeout(() => setCopiedWorkflow(false), 2000);
  };

  const handleShare = () => {
    onShareLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#090e15] border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1e2c40] bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#090e15] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.4)]">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Space_Grotesk'] text-white flex items-center gap-2">
                GitHub Stargazer Studio & Star Booster
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  ⭐ Star Magnet
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Turn this project into a top-rated GitHub repository that gets tons of stars!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#15202f] hover:bg-[#1f2f45] border border-[#1e2c40] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive GitHub Repo Star Preview Card */}
        <div className="p-4 bg-[#05080c] border-b border-[#1e2c40]">
          <div className="bg-[#0f1622] border border-[#1e2c40] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <Github className="w-3.5 h-3.5" />
                <span>github.com/</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[#090e15] border border-[#1e2c40] px-1.5 py-0.5 rounded text-white text-xs outline-none focus:border-purple-500 w-24 font-mono"
                  placeholder="username"
                />
                <span>/</span>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="bg-[#090e15] border border-[#1e2c40] px-1.5 py-0.5 rounded text-white text-xs outline-none focus:border-purple-500 w-44 font-mono"
                  placeholder="repo-name"
                />
              </div>
              <p className="text-xs text-slate-300">
                Official Arduino UNO Q & Ventuno Q EDA Simulator & Qualcomm Dragonwing AI Lab.
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  TypeScript 94.2%
                </span>
                <span>MIT License</span>
                <span className="text-purple-300">v1.0.0 Release</span>
              </div>
            </div>

            {/* Interactive Star Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onStarRepo}
                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-lg ${
                  hasStarred
                    ? 'bg-amber-400 text-amber-950 shadow-amber-400/30 scale-105'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:scale-105'
                }`}
              >
                <Star className={`w-4 h-4 ${hasStarred ? 'fill-slate-950' : 'fill-none'}`} />
                <span>{hasStarred ? 'Starred!' : 'Star This Repo'}</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[11px]">
                  {gitHubStars}
                </span>
              </button>

              <button
                onClick={handleShare}
                className="px-3 py-2 bg-[#15202f] hover:bg-[#1e2c40] border border-[#1e2c40] rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                {copiedLink ? 'Copied Link!' : 'Share'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e2c40] px-4 bg-[#090e15]">
          <button
            onClick={() => setActiveSubTab('readme')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeSubTab === 'readme'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            README.md Generator
          </button>
          <button
            onClick={() => setActiveSubTab('ghpages')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeSubTab === 'ghpages'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            GitHub Pages Deploy
          </button>
          <button
            onClick={() => setActiveSubTab('starstrategy')}
            className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeSubTab === 'starstrategy'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            How to Get 100+ Stars Guide
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Subtab 1: README GENERATOR */}
          {activeSubTab === 'readme' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  Copy this production-grade README directly into your GitHub repository’s <code className="text-cyan-400 font-mono">README.md</code>. It includes shields, badges, and quickstart commands!
                </p>
                <button
                  onClick={handleCopyReadme}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors shrink-0"
                >
                  {copiedReadme ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReadme ? 'Copied to Clipboard!' : 'Copy README.md'}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-[#05080c] border border-[#1e2c40] rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[300px] leading-relaxed">
                  {readmeMarkdown}
                </pre>
              </div>
            </div>
          )}

          {/* Subtab 2: GITHUB PAGES DEPLOYMENT */}
          {activeSubTab === 'ghpages' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Host on GitHub Pages for Free!
                </div>
                <p className="text-[11px] text-slate-300">
                  When you host this simulator live on <code className="text-cyan-400 font-mono">{username}.github.io/{repoName}</code>, students and GitHub visitors can run Arduino code right from their browser — leading directly to more stars!
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>GitHub Actions Workflow (<code className="text-cyan-400 font-mono">.github/workflows/deploy.yml</code>)</span>
                  <button
                    onClick={handleCopyWorkflow}
                    className="px-2.5 py-1 bg-[#15202f] hover:bg-[#1e2c40] border border-[#1e2c40] rounded text-[11px] font-semibold text-slate-200 flex items-center gap-1"
                  >
                    {copiedWorkflow ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedWorkflow ? 'Copied!' : 'Copy Workflow'}
                  </button>
                </div>

                <pre className="p-3 bg-[#05080c] border border-[#1e2c40] rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-[220px]">
                  {ghActionsWorkflow}
                </pre>
              </div>
            </div>
          )}

          {/* Subtab 3: HOW TO GET 100+ STARS */}
          {activeSubTab === 'starstrategy' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#0f1622] border border-[#1e2c40] rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    1. Live Web Demo Link
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Repositories with a working live preview in the repo description get <b>4x more stars</b> because visitors don't have to clone and compile.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0f1622] border border-[#1e2c40] rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    2. Animated Circuit GIF in README
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Record a 5-second screen capture of the 104-LED matrix animating or buzzer sounding and insert it as the header image in README.md.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0f1622] border border-[#1e2c40] rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    3. Badges & GitHub Topics
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Add repository topics: <code className="text-cyan-300">arduino</code>, <code className="text-cyan-300">qualcomm</code>, <code className="text-cyan-300">simulator</code>, <code className="text-cyan-300">stem-education</code>, <code className="text-cyan-300">stm32</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-[#0f1622] border border-[#1e2c40] rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Rocket className="w-4 h-4" />
                    4. Share on Communities
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Post on Reddit <code className="text-emerald-300">r/arduino</code>, <code className="text-emerald-300">r/embedded</code>, and Discord with the title: <i>"I built an interactive Arduino UNO Q & Ventuno Q simulator for students!"</i>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1e2c40] bg-[#05080c] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            Ready to upload to <span className="text-cyan-400 font-bold">github.com/{username}/{repoName}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
