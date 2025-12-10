-- Insert Expense Categories
INSERT INTO categories (name, type, color) VALUES
('Personel Giderleri', 'expense', '#ef4444'),
('Operasyonel Giderler', 'expense', '#f97316'),
('Malzeme ve Ekipman', 'expense', '#eab308'),
('Ulaşım ve Seyahat', 'expense', '#3b82f6'),
('Pazarlama ve Tanıtım', 'expense', '#8b5cf6'),
('Kira ve Aidat', 'expense', '#ec4899'),
('Bakım ve Onarım', 'expense', '#6366f1'),
('Vergi ve Harçlar', 'expense', '#14b8a6'),
('Diğer Giderler', 'expense', '#64748b');

-- Insert Income Categories
INSERT INTO categories (name, type, color) VALUES
('Bağış Gelirleri', 'income', '#10b981'),
('Proje Gelirleri', 'income', '#06b6d4'),
('Hizmet Gelirleri', 'income', '#8b5cf6'),
('Üyelik Aidatları', 'income', '#f59e0b'),
('Sponsorluk Gelirleri', 'income', '#ec4899'),
('Genel Merkez Bütçe Aktarımı', 'income', '#3b82f6'),
('Diğer Gelirler', 'income', '#64748b');
