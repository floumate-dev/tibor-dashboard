-- Seed data za testiranje
-- Pokreni ovo u Supabase SQL editoru nakon što primeniš migraciju

-- Test organizacija
INSERT INTO organizations (id, name, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Demo Klijent', 'demo-klijent'),
  ('22222222-2222-2222-2222-222222222222', 'Fitness Program', 'fitness-program');

-- Test leadovi za Demo Klijent
INSERT INTO leads (org_id, source, medium, campaign, email, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'cpc', 'promo-mart', 'lead1@test.com', NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'cpc', 'promo-mart', 'lead2@test.com', NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'cpc', 'retarget', 'lead3@test.com', NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'google', 'cpc', 'brand', 'lead4@test.com', NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'google', 'organic', NULL, 'lead5@test.com', NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'instagram', 'cpc', 'story-ad', 'lead6@test.com', NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'instagram', 'cpc', 'story-ad', 'lead7@test.com', NOW() - INTERVAL '4 days'),
  ('11111111-1111-1111-1111-111111111111', 'direct', NULL, NULL, 'lead8@test.com', NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'youtube', 'video', 'tutorial', 'lead9@test.com', NOW() - INTERVAL '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'cpc', 'lookalike', 'lead10@test.com', NOW() - INTERVAL '7 days'),
  ('11111111-1111-1111-1111-111111111111', 'google', 'cpc', 'brand', 'lead11@test.com', NOW() - INTERVAL '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'tiktok', 'cpc', 'viral', 'lead12@test.com', NOW() - INTERVAL '12 days'),
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'cpc', 'promo-mart', 'lead13@test.com', NOW() - INTERVAL '15 days'),
  ('11111111-1111-1111-1111-111111111111', 'google', 'organic', NULL, 'lead14@test.com', NOW() - INTERVAL '20 days'),
  ('11111111-1111-1111-1111-111111111111', 'instagram', 'cpc', 'reel-ad', 'lead15@test.com', NOW() - INTERVAL '25 days');

-- Test kupovine za Demo Klijent
INSERT INTO purchases (org_id, source, medium, campaign, amount, currency, email, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'cpc', 'promo-mart', 97, 'EUR', 'lead1@test.com', NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111111', 'google', 'cpc', 'brand', 97, 'EUR', 'lead4@test.com', NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'cpc', 'retarget', 197, 'EUR', 'lead3@test.com', NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'instagram', 'cpc', 'story-ad', 97, 'EUR', 'lead6@test.com', NOW() - INTERVAL '4 days'),
  ('11111111-1111-1111-1111-111111111111', 'direct', NULL, NULL, 297, 'EUR', 'lead8@test.com', NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'google', 'organic', NULL, 97, 'EUR', 'lead14@test.com', NOW() - INTERVAL '20 days');

-- Test leadovi za Fitness Program
INSERT INTO leads (org_id, source, medium, campaign, email, created_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'instagram', 'cpc', 'summer-body', 'fit1@test.com', NOW() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'instagram', 'cpc', 'summer-body', 'fit2@test.com', NOW() - INTERVAL '2 days'),
  ('22222222-2222-2222-2222-222222222222', 'facebook', 'cpc', 'testimonial', 'fit3@test.com', NOW() - INTERVAL '3 days'),
  ('22222222-2222-2222-2222-222222222222', 'youtube', 'video', 'workout', 'fit4@test.com', NOW() - INTERVAL '5 days'),
  ('22222222-2222-2222-2222-222222222222', 'tiktok', 'organic', NULL, 'fit5@test.com', NOW() - INTERVAL '7 days');

-- Test kupovine za Fitness Program
INSERT INTO purchases (org_id, source, medium, campaign, amount, currency, email, created_at) VALUES
  ('22222222-2222-2222-2222-222222222222', 'instagram', 'cpc', 'summer-body', 49, 'EUR', 'fit1@test.com', NOW() - INTERVAL '1 day'),
  ('22222222-2222-2222-2222-222222222222', 'facebook', 'cpc', 'testimonial', 49, 'EUR', 'fit3@test.com', NOW() - INTERVAL '4 days');
