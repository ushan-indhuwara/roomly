// Roomly - Dedicated Journal & Interior Design Guides Page
// Separated from the main floor planner workspace

import React, { useState, useMemo } from 'react';
import { ARTICLES } from '../data/roomData';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Sparkles } from 'lucide-react';

const CATEGORIES = ['All', 'Small Spaces', 'Lighting', 'Layout', 'Sustainability'];

export default function JournalPage({ onBackToPlanner, onReadArticle, currentRoomName }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'All') return ARTICLES;
    return ARTICLES.filter(a => a.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }, [selectedCategory]);

  return (
    <div className="journal-page">
      {/* Top Breadcrumb & Return to Planner */}
      <div className="journal-page-topbar">
        <button 
          className="btn btn-secondary journal-back-btn" 
          onClick={onBackToPlanner}
          title="Return to Floor Planner"
        >
          <ArrowLeft size={16} />
          <span>Return to Studio Planner {currentRoomName ? `(${currentRoomName})` : ''}</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="journal-hero">
        <div className="section-eyebrow">
          <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
          The Roomly Design Journal
        </div>
        <h1 className="journal-hero-title">Ideas, layouts & living well.</h1>
        <p className="journal-hero-subtitle">
          Curated styling advice, spatial planning rules, and decor inspiration crafted by interior architects to help you furnish with confidence.
        </p>

        {/* Category Filter Pills */}
        <div className="journal-filter-pills">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`journal-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="journal-articles-container">
        <div className="article-grid">
          {filteredArticles.map(article => (
            <article key={article.id} className="journal-page-card">
              <a
                href={`/journal/${encodeURIComponent(article.id)}/`}
                className="article-card journal-article-link"
                onClick={(event) => { event.preventDefault(); onReadArticle(article); }}
                aria-label={`Read ${article.title}`}
              >
              <div 
                className="article-cover" 
                style={{ background: article.gradient || '#FAF7F0' }}
              >
                <span style={{ fontSize: '2.5rem' }}>{article.heroIcon || '🛋️'}</span>
              </div>

              <div className="article-body">
                <div className="article-tag">{article.category} · {article.readTime}</div>
                <h3 className="article-title">{article.title}</h3>
                <p className="article-summary">{article.summary}</p>
                
                <div className="article-footer">
                  <span style={{ fontWeight: 700, color: 'var(--sage-700)' }}>Read guide</span>
                  <ArrowRight size={14} color="var(--sage-700)" />
                </div>
              </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
