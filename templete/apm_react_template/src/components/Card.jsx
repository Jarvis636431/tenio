import React from 'react';
import './Card.css';

/**
 * Card 组件 - 通用卡片容器
 * @param {ReactNode} children - 卡片内容
 * @param {string} className - 额外的 CSS 类名
 * @param {boolean} hoverable - 是否启用悬停效果
 * @param {function} onClick - 点击回调
 */
export const Card = ({
  children,
  className = '',
  hoverable = false,
  onClick,
  ...props
}) => {
  return (
    <div
      className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ProjectCard 组件 - 项目卡片（特化版本）
 */
export const ProjectCard = ({
  icon,
  title,
  meta,
  contractPeriod,
  price,
  aiDocs,
  progress,
  progressLabel,
  endDate,
  status,
  startDate,
  timeInfo,
  onClick,
}) => {
  return (
    <Card hoverable onClick={onClick} className="project-card">
      <div className="pc-header">
        <div className="pc-icon">{icon}</div>
        <div>
          <div className="pc-title">{title}</div>
          <div className="pc-meta">{meta}</div>
        </div>
      </div>

      <div className="pc-body">
        <div className="pc-info-row">
          <div className="pc-info-item">
            <span className="pc-info-label">合同工期</span>
            <span className="pc-info-value">{contractPeriod} <small>日历天</small></span>
          </div>
          <div className="pc-info-item">
            <span className="pc-info-label">发包价</span>
            <span className="pc-info-value">{price} <small>万元</small></span>
          </div>
          <div className="pc-info-item">
            <span className="pc-info-label">AI 文档</span>
            <span className="pc-info-value">{aiDocs} <small>份</small></span>
          </div>
        </div>

        <div className="pc-progress">
          <div className="pc-progress-label">
            项目进度 <span>{progress}%</span>
          </div>
          <div className="pc-bar">
            <div
              className="pc-fill"
              style={{
                width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg, var(--color-success), #059669)'
                  : 'linear-gradient(90deg, var(--color-accent), #0099ff)',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <span style={{ fontSize: '9px', color: 'var(--color-text-dim)' }}>
            <i className="fas fa-calendar-alt" style={{ marginRight: '3px' }} />
            {endDate}
          </span>
          <span style={{
            fontSize: '9px',
            color: progress === 100 ? 'var(--color-success)' : 'var(--color-accent)',
          }}>
            <i className="fas fa-check-circle" style={{ marginRight: '2px' }} />
            {progressLabel}
          </span>
        </div>
      </div>

      <div className="pc-footer">
        <span className={`btn-status btn-status-${status}`}>
          {status === 'active' ? '进行中' : status === 'done' ? '已完成' : '待启动'}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-dim)' }}>
          {startDate}
        </span>
        <span className="pc-date" style={{ marginLeft: 'auto' }}>
          <i className="fas fa-calendar-check" style={{ marginRight: '3px' }} />
          {timeInfo}
        </span>
      </div>
    </Card>
  );
};

export default Card;
