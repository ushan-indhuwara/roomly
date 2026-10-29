// Roomly - Home and Interior Design Articles & Journal Section

import React from 'react';
import { ARTICLES } from '../data/roomData';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';

export default function JournalSection({ onReadArticle }) {
  return (
    <section className="journal-section" id="journal">
      <div className="journal-header">
        <div>
          <div className="section-eyebrow">The Roomly Journal</div>
          <h2 className="section-title">Ideas, layouts & living well.</h2>
        </div>
        <span style={{ fontSize: '0.85rem', color: '#626D65', fontWeight: 600 }}>
          Curated styling advice from interior architects
        </span>
      </div>

      <div className="article-grid">
        {ARTICLES.map(article => (
          <article 
            key={article.id} 
            className="article-card"
            onClick={() => onReadArticle(article)}
          >
            <div 
              className="article-cover" 
              style={{ background: article.gradient || '#FAF7F0' }}
            >
              <span>{article.heroIcon || '🛋️'}</span>
            </div>

            <div className="article-body">
              <div className="article-tag">{article.category} · {article.readTime}</div>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-summary">{article.summary}</p>
              
              <div className="article-footer">
                <span>Read story</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
