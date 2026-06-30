USE ai_novel_creation;

INSERT INTO books (id, name, category, sub_category, status, description)
VALUES
  (1, '烬海回声', '悬疑', '群像', 'draft', '围绕深海都市、失踪事件与集体记忆展开的演示作品。'),
  (2, '秩序裂缝', '科幻', '成长流', 'planning', '围绕规则失真与个体成长构建的演示作品。')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  category = VALUES(category),
  sub_category = VALUES(sub_category),
  status = VALUES(status),
  description = VALUES(description);

INSERT INTO characters (id, book_id, name, role_type, summary, personality_profile)
VALUES
  (1, 1, '林砚', 'protagonist', '理性强、控制欲强，适合作为主视角角色。', JSON_OBJECT('rationality', 72, 'ambition', 81, 'control', 84)),
  (2, 1, '周栖', 'supporting', '外冷内热，适合承担情感拉扯与价值冲突。', JSON_OBJECT('empathy', 66, 'trustThreshold', 'high', 'contrast', 'strong'))
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role_type = VALUES(role_type),
  summary = VALUES(summary),
  personality_profile = VALUES(personality_profile);

INSERT INTO outlines (id, book_id, level, title, summary, status, sort_order)
VALUES
  (1, 1, 'global', '总纲', '围绕记忆异常与深海都市危机展开。', 'generated', 1),
  (2, 1, 'volume', '第一卷', '建立核心设定并投放第一批伏笔。', 'draft', 2)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  summary = VALUES(summary),
  status = VALUES(status),
  sort_order = VALUES(sort_order);

INSERT INTO foreshadows (id, book_id, title, surface_info, real_intent, target_payoff, status)
VALUES
  (1, 1, '断裂录音', '录音第 17 秒消失，表面看像设备故障。', '用于揭示主角记忆被篡改。', '第一卷末揭晓真相', 'planned'),
  (2, 1, '海面白塔', '只在风暴夜出现的远海建筑影像。', '映射主线世界观异常。', '身份揭晓前的连续提示', 'draft')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  surface_info = VALUES(surface_info),
  real_intent = VALUES(real_intent),
  target_payoff = VALUES(target_payoff),
  status = VALUES(status);

INSERT INTO chapters (id, book_id, chapter_no, title, content, status, word_count)
VALUES
  (1, 1, 1, '风暴前的留声机', '这里是章节正文占位内容。', 'draft', 2860),
  (2, 1, 2, '不存在的目击者', '这里是章节正文占位内容。', 'reviewing', 3145)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  status = VALUES(status),
  word_count = VALUES(word_count);
