-- Add room_type column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type VARCHAR(20) NOT NULL DEFAULT 'classroom' CHECK (room_type IN ('classroom', 'lab'));

-- Update existing rooms based on name pattern
UPDATE rooms SET room_type = 'lab' WHERE room_name ILIKE '%lab%';
