# Architecture Plan

Add room type to Rooms table

DO is never directly aware of what "type" it is

DO has full schema for all game types

DO has a lookup map for incoming message types, which can be composed, segmented etc.

DO can store settings in KV but everything has a default value

Incoming roll messages are tagged with a type, which is added to the messages table

UI uses roomType to select components from a map - chat bar, sidebar, 

roll display is keyed on the roll type, not the room type - so if a room changes type old rolls still look right
