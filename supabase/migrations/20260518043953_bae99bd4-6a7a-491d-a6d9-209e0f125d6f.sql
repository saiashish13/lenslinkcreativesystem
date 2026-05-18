
-- Messages tied to a booking (customer <-> creator)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_booking ON public.messages(booking_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = messages.booking_id
    AND (b.customer_id = auth.uid() OR b.creator_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = messages.booking_id
      AND (b.customer_id = auth.uid() OR b.creator_user_id = auth.uid())
  )
);
CREATE POLICY "Recipients mark read" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = messages.booking_id
    AND (b.customer_id = auth.uid() OR b.creator_user_id = auth.uid()))
);

-- Reviews from customer to professional handle (only after completed booking)
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  professional_handle text NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, customer_id)
);
CREATE INDEX idx_reviews_handle ON public.reviews(professional_handle);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers write own reviews" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = customer_id AND EXISTS (
    SELECT 1 FROM public.bookings b WHERE b.id = reviews.booking_id
      AND b.customer_id = auth.uid() AND b.status = 'completed'
  )
);
CREATE POLICY "Customers update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Customers delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = customer_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- Inserts come from triggers (security definer) — no client insert policy needed

-- Trigger: notify on new message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recipient uuid;
  booking_record record;
BEGIN
  SELECT customer_id, creator_user_id, professional_name INTO booking_record
    FROM public.bookings WHERE id = NEW.booking_id;
  recipient := CASE WHEN NEW.sender_id = booking_record.customer_id
                    THEN booking_record.creator_user_id
                    ELSE booking_record.customer_id END;
  IF recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (recipient, 'message', 'New message',
      LEFT(NEW.body, 120), '/app');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_on_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Trigger: notify on booking status change
CREATE OR REPLACE FUNCTION public.notify_on_booking_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.creator_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.creator_user_id, 'booking', 'New booking request',
      'For ' || NEW.category, '/pro');
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.customer_id, 'booking',
      'Booking ' || NEW.status,
      NEW.professional_name || ' updated your booking',
      '/app');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_booking_insert AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_change();
CREATE TRIGGER trg_notify_booking_update AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_booking_change();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
