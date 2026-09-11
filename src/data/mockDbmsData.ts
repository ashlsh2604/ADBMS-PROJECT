import { Channel, Video, MonthlyGrowth, TrendingAlert, UserAccount, SavedQuery, DbmsQueryResult } from '../types/database';

export const PRIMARY_CHANNEL_ID = 'ashrides26_official';

export const CHANNELS: Channel[] = [
  {
    channel_id: 'ashrides26_official',
    name: 'AshRides26',
    handle: '@ashrides26',
    avatar_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&auto=format&fit=crop&q=80',
    subscribers: 342800,
    total_views: 48920400,
    total_videos: 148,
    country: 'United States',
    primary_bike: 'Yamaha YZF-R1M, Kawasaki ZX-10R & Adventure Rig',
    joined_date: '2021-04-12',
    verified: true,
    is_primary: true,
    description: 'Official YouTube channel @ashrides26. Dedicated to motorcycle adventure tours (Gainesville to Asheville, NC), mountain twisties, trail alterations & maintenance, raw canyon motovlogs, and superbike telemetry.',
    avg_views_per_video: 330543,
    sub_growth_monthly_pct: 7.8,
    channel_url: 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO'
  }
];

export const VIDEOS: Video[] = [
  {
    video_id: 'ash_vid_adv_01',
    channel_id: 'ashrides26_official',
    title: 'Motorcycle Adventure: Gainesville to Asheville NC - Mountain Twisties & Scenic Passes',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    category: 'vlog',
    bike_model: 'Adventure Sport Touring Rig',
    duration_seconds: 1620, // 27 mins
    upload_date: '2026-08-28',
    views: 742000,
    likes: 68400,
    comments: 4920,
    retention_pct: 73.5,
    watch_time_hours: 198000,
    ctr_pct: 14.2,
    cpm_usd: 7.80,
    estimated_revenue_usd: 5787,
    velocity_views_per_hr: 1120,
    tags: ['AshRides26', 'Gainesville', 'Asheville NC', 'Mountain Twisties', 'Motorcycle Trip', 'Adventure Riding', 'Blue Ridge'],
    is_trending: true,
    trending_score: 97,
    audio_sound_profile: 'Windslayer Helmet Audio + Sena 50S Intercom with Dad',
    top_demographic: 'Adventure & Dual-Sport Riders 20-50',
    youtube_url: 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Departing Gainesville Highway Run' },
      { second: 240, pct_retention: 91, chapter_name: 'Crossing Georgia State Line' },
      { second: 620, pct_retention: 86, chapter_name: 'First Mountain Twisties & Elevation Climb' },
      { second: 950, pct_retention: 90, chapter_name: 'Trail Alterations & Small Crash Save', is_spike_point: true, note: 'Rewatched 1.3x' },
      { second: 1300, pct_retention: 78, chapter_name: 'Car Show Encounter in the Valley' },
      { second: 1620, pct_retention: 62, chapter_name: 'Arriving in Asheville NC & Wrap Up' }
    ]
  },
  {
    video_id: 'ash_vid_adv_02',
    channel_id: 'ashrides26_official',
    title: 'Trail Alterations & Quick Repairs on the Mountain Trail | Roadtrip Vlog',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?w=600&auto=format&fit=crop&q=80',
    category: 'vlog',
    bike_model: 'Adventure Sport / Dual Setup',
    duration_seconds: 1180, // 19.6 mins
    upload_date: '2026-08-15',
    views: 531000,
    likes: 44100,
    comments: 3120,
    retention_pct: 69.8,
    watch_time_hours: 123000,
    ctr_pct: 11.5,
    cpm_usd: 7.10,
    estimated_revenue_usd: 3770,
    velocity_views_per_hr: 680,
    tags: ['AshRides26', 'Trail Repairs', 'Motorcycle Maintenance', 'Roadtrip', 'Offroad', 'Tool Kit'],
    is_trending: false,
    trending_score: 82,
    audio_sound_profile: 'Trailside Ambient + Tool Clanks',
    top_demographic: 'Motorcycle Tour & DIY Riders',
    youtube_url: 'https://youtube.com/@ashrides26?si=fFlM8mxI6AMdyinO',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Trail Stop & Inspection' },
      { second: 180, pct_retention: 88, chapter_name: 'Assessing Trail Incident & Scrapes' },
      { second: 450, pct_retention: 84, chapter_name: 'Unpacking Portable Tool Kit' },
      { second: 750, pct_retention: 87, chapter_name: 'Adjusting Levers & Trail Fixes', is_spike_point: true },
      { second: 1180, pct_retention: 58, chapter_name: 'Back on the Twisties' }
    ]
  },
  {
    video_id: 'ash_vid_01',
    channel_id: 'ashrides26_official',
    title: '2024 Ducati Panigale V4 S Track Review - SC-Project Exhaust Sound & Top Speed',
    thumbnail_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
    category: 'bike_review',
    bike_model: 'Ducati Panigale V4 S',
    duration_seconds: 1140, // 19 mins
    upload_date: '2026-07-15',
    views: 894200,
    likes: 62400,
    comments: 3820,
    retention_pct: 68.4,
    watch_time_hours: 194600,
    ctr_pct: 11.2,
    cpm_usd: 7.45,
    estimated_revenue_usd: 6661,
    velocity_views_per_hr: 820,
    tags: ['Ducati', 'Panigale V4S', 'SC-Project', 'Track Test', 'Top Speed', 'Superbike'],
    is_trending: true,
    trending_score: 96,
    audio_sound_profile: 'SC-Project Titanium CR-T (118 dB)',
    top_demographic: 'Men 18-34 (84%)',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Intro & Cold Start Hook' },
      { second: 60, pct_retention: 89, chapter_name: 'Walkaround & Specs' },
      { second: 180, pct_retention: 84, chapter_name: 'Chassis & Electronics' },
      { second: 360, pct_retention: 79, chapter_name: 'Pit Exit Lap 1' },
      { second: 600, pct_retention: 74, chapter_name: 'Full Throttle 186+ MPH Straight', is_spike_point: true, note: 'Exhaust audio spike' },
      { second: 840, pct_retention: 67, chapter_name: 'Braking Telemetry & Corner Entry' },
      { second: 1020, pct_retention: 59, chapter_name: 'Final Verdict & Lap Times', is_drop_point: true },
      { second: 1140, pct_retention: 48, chapter_name: 'Outro' }
    ]
  },
  {
    video_id: 'ash_vid_02',
    channel_id: 'ashrides26_official',
    title: 'Yamaha R1M vs BMW S1000RR 2024 - Brutal Canyon Comparison Battle!',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
    category: 'bike_review',
    bike_model: 'Yamaha YZF-R1M & BMW S1000RR',
    duration_seconds: 1480, // 24.6 mins
    upload_date: '2026-06-28',
    views: 1240500,
    likes: 88900,
    comments: 5410,
    retention_pct: 72.1,
    watch_time_hours: 312000,
    ctr_pct: 12.8,
    cpm_usd: 8.10,
    estimated_revenue_usd: 10048,
    velocity_views_per_hr: 1240,
    tags: ['Yamaha R1M', 'BMW S1000RR', 'Crossplane vs ShiftCam', 'Canyon Comparison', 'Shootout'],
    is_trending: true,
    trending_score: 98,
    audio_sound_profile: 'Austin Racing GP1R vs Akrapovic Full System',
    top_demographic: 'Men 25-44 (78%)',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'The Matchup Grid' },
      { second: 120, pct_retention: 92, chapter_name: 'Sound Battle: CP4 vs Inline 4', is_spike_point: true, note: 'Massive replay retention' },
      { second: 400, pct_retention: 86, chapter_name: 'R1M Canyon Run' },
      { second: 780, pct_retention: 81, chapter_name: 'S1000RR ShiftCam Pull' },
      { second: 1100, pct_retention: 75, chapter_name: 'Head to Head Drag Telemetry' },
      { second: 1350, pct_retention: 65, chapter_name: 'Which One Should You Buy?' },
      { second: 1480, pct_retention: 54, chapter_name: 'End Screen' }
    ]
  },
  {
    video_id: 'ash_vid_03',
    channel_id: 'ashrides26_official',
    title: 'Police Stopped Us in the Canyons! | Weekend Group Ride with Ducati V4 & ZX-10R',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    category: 'vlog',
    bike_model: 'Kawasaki Ninja ZX-10R',
    duration_seconds: 1020, // 17 mins
    upload_date: '2026-08-10',
    views: 645000,
    likes: 47200,
    comments: 4120,
    retention_pct: 64.2,
    watch_time_hours: 114200,
    ctr_pct: 13.9,
    cpm_usd: 6.20,
    estimated_revenue_usd: 3999,
    velocity_views_per_hr: 940,
    tags: ['Motovlog', 'Police Stop', 'Canyon Run', 'ZX-10R', 'Group Ride', 'Biker Moments'],
    is_trending: true,
    trending_score: 92,
    audio_sound_profile: 'Dual Sena 50S Intercom + Windslayer Foam',
    top_demographic: 'Men 18-30 (88%)',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Highway Meetup' },
      { second: 180, pct_retention: 88, chapter_name: 'Heading into the Mountains' },
      { second: 420, pct_retention: 82, chapter_name: 'Spirited Pace in the Sweepers' },
      { second: 600, pct_retention: 86, chapter_name: 'Sirens in the Rearview Mirror', is_spike_point: true, note: 'Dramatic tension peak' },
      { second: 800, pct_retention: 71, chapter_name: 'Friendly Cop Breakdown & Gear Check' },
      { second: 1020, pct_retention: 52, chapter_name: 'Ride Back at Sunset' }
    ]
  },
  {
    video_id: 'ash_vid_04',
    channel_id: 'ashrides26_official',
    title: 'R1M Crossplane Cold Start & Revs 🔥🔊 (Ear Protection Needed!)',
    thumbnail_url: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=600&auto=format&fit=crop&q=80',
    category: 'shorts',
    bike_model: 'Yamaha YZF-R1M',
    duration_seconds: 48, // 48s Short
    upload_date: '2026-08-20',
    views: 1820000,
    likes: 194000,
    comments: 6890,
    retention_pct: 94.6,
    watch_time_hours: 24200,
    ctr_pct: 18.5,
    cpm_usd: 1.85,
    estimated_revenue_usd: 3367,
    velocity_views_per_hr: 4120,
    tags: ['R1M', 'Cold Start', 'Exhaust Sound', 'Crossplane', 'Shorts', 'Superbike'],
    is_trending: true,
    trending_score: 99,
    audio_sound_profile: 'Binaural 3D Mic + 14k RPM limiter',
    top_demographic: 'Global Audience 16-35',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Key Turn & Dash Sweep' },
      { second: 10, pct_retention: 98, chapter_name: 'Starter Motor Whine' },
      { second: 18, pct_retention: 96, chapter_name: 'CP4 Idle Rumble' },
      { second: 32, pct_retention: 95, chapter_name: '14,000 RPM Throttle Blips', is_spike_point: true, note: 'Rewatched 1.4x per view' },
      { second: 48, pct_retention: 91, chapter_name: 'Flame Pops' }
    ]
  },
  {
    video_id: 'ash_vid_05',
    channel_id: 'ashrides26_official',
    title: '2024 Kawasaki Ninja ZX-10R First Ride & Full Dyno Run Analysis',
    thumbnail_url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=80',
    category: 'bike_review',
    bike_model: 'Kawasaki Ninja ZX-10R',
    duration_seconds: 1320, // 22 mins
    upload_date: '2026-05-14',
    views: 520000,
    likes: 38400,
    comments: 2650,
    retention_pct: 66.8,
    watch_time_hours: 128000,
    ctr_pct: 9.8,
    cpm_usd: 7.20,
    estimated_revenue_usd: 3744,
    velocity_views_per_hr: 430,
    tags: ['Kawasaki', 'ZX10R', 'Dyno Test', 'Horsepower', 'Bike Review', 'WSBK Tech'],
    is_trending: false,
    trending_score: 74,
    audio_sound_profile: 'Graves Full Titanium Exhaust',
    top_demographic: 'Men 20-40 (82%)',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Dyno Room Teaser' },
      { second: 200, pct_retention: 85, chapter_name: 'Design & Aerodynamics' },
      { second: 550, pct_retention: 78, chapter_name: 'Street Riding Impressions' },
      { second: 880, pct_retention: 82, chapter_name: 'Full Dyno Pull (203.4 WHP)', is_spike_point: true },
      { second: 1100, pct_retention: 63, chapter_name: 'ECU Flash Potential' },
      { second: 1320, pct_retention: 49, chapter_name: 'Final Score' }
    ]
  },
  {
    video_id: 'ash_vid_06',
    channel_id: 'ashrides26_official',
    title: 'Almost Lowsided My Yamaha R1M at 140mph... (Close Call Helmet Cam)',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?w=600&auto=format&fit=crop&q=80',
    category: 'vlog',
    bike_model: 'Yamaha YZF-R1M',
    duration_seconds: 940, // 15.6 mins
    upload_date: '2026-07-04',
    views: 920400,
    likes: 71500,
    comments: 6320,
    retention_pct: 75.3,
    watch_time_hours: 184000,
    ctr_pct: 15.4,
    cpm_usd: 6.80,
    estimated_revenue_usd: 6258,
    velocity_views_per_hr: 670,
    tags: ['Close Call', 'Lowside Save', 'Traction Control', 'R1M Telemetry', 'Motovlog', 'Gravel Trap'],
    is_trending: false,
    trending_score: 84,
    audio_sound_profile: 'GoPro Hero 12 Black + Media Mod Windshield',
    top_demographic: 'Men 18-35 (91%)',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'The Moment of Slip (0.5s Clip)' },
      { second: 90, pct_retention: 94, chapter_name: 'Pre-Ride Tire Prep' },
      { second: 360, pct_retention: 87, chapter_name: 'Pacing the Leading S1000RR' },
      { second: 520, pct_retention: 91, chapter_name: 'Corner 7 Gravel Patch & IMU Save', is_spike_point: true, note: 'Highest replay index' },
      { second: 720, pct_retention: 76, chapter_name: 'Pulling Over & Checking Tires' },
      { second: 940, pct_retention: 60, chapter_name: 'Lessons in Track Surface Reading' }
    ]
  },
  {
    video_id: 'ash_vid_07',
    channel_id: 'ashrides26_official',
    title: 'Quickshifter Pops on ZX-10R 💥 Pure Sound #Shorts',
    thumbnail_url: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=600&auto=format&fit=crop&q=80',
    category: 'shorts',
    bike_model: 'Kawasaki Ninja ZX-10R',
    duration_seconds: 35,
    upload_date: '2026-08-14',
    views: 1450000,
    likes: 152000,
    comments: 4210,
    retention_pct: 96.2,
    watch_time_hours: 14100,
    ctr_pct: 17.2,
    cpm_usd: 1.60,
    estimated_revenue_usd: 2320,
    velocity_views_per_hr: 2890,
    tags: ['Quickshifter', 'Autoblipper', 'ZX10R', 'Exhaust Backfire', 'Shorts', 'Kawasaki'],
    is_trending: true,
    trending_score: 95,
    audio_sound_profile: 'Kawasaki KQS Ignition Cut Pops',
    top_demographic: 'Global Audience',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Launch from Standstill' },
      { second: 12, pct_retention: 98, chapter_name: '1st to 2nd Gear Pop' },
      { second: 22, pct_retention: 97, chapter_name: '2nd to 3rd Bang 💥', is_spike_point: true },
      { second: 35, pct_retention: 93, chapter_name: 'Autoblip Downshifts' }
    ]
  },
  {
    video_id: 'ash_vid_08',
    channel_id: 'ashrides26_official',
    title: 'KTM 890 Duke R "The Super Scalpel" - Is It The Ultimate Street Bike?',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981420-87aa9210d991?w=600&auto=format&fit=crop&q=80',
    category: 'bike_review',
    bike_model: 'KTM 890 Duke R',
    duration_seconds: 1080, // 18 mins
    upload_date: '2026-04-02',
    views: 410000,
    likes: 29800,
    comments: 1890,
    retention_pct: 61.5,
    watch_time_hours: 87500,
    ctr_pct: 8.7,
    cpm_usd: 6.90,
    estimated_revenue_usd: 2829,
    velocity_views_per_hr: 210,
    tags: ['KTM', 'Duke 890R', 'Super Scalpel', 'Naked Bike', 'Brembo Stylema', 'Wheelie Machine'],
    is_trending: false,
    trending_score: 62,
    audio_sound_profile: 'Austin Racing De-Cat Twin Pipe',
    top_demographic: 'Men 25-50',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Wheelie Intro' },
      { second: 240, pct_retention: 82, chapter_name: 'Ergonomics & WP Apex Pro Setup' },
      { second: 600, pct_retention: 71, chapter_name: 'Aggressive Urban Riding' },
      { second: 900, pct_retention: 60, chapter_name: 'Track Session Feedback' },
      { second: 1080, pct_retention: 45, chapter_name: 'Buying Advice' }
    ]
  },
  {
    video_id: 'ash_vid_09',
    channel_id: 'ashrides26_official',
    title: 'Night Ride through Neon City + POV GoPro 12 Mic Audio Setup Test',
    thumbnail_url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=80',
    category: 'vlog',
    bike_model: 'Ducati Panigale V4 S',
    duration_seconds: 1260, // 21 mins
    upload_date: '2026-06-12',
    views: 485000,
    likes: 41200,
    comments: 2940,
    retention_pct: 69.1,
    watch_time_hours: 118400,
    ctr_pct: 10.4,
    cpm_usd: 6.50,
    estimated_revenue_usd: 3152,
    velocity_views_per_hr: 380,
    tags: ['Night Ride', 'Tokyo Vibe', 'Cyberpunk', 'Ducati V4', 'GoPro Mic Setup', 'Relaxing Motovlog'],
    is_trending: false,
    trending_score: 76,
    audio_sound_profile: 'Custom Chin Mount DPA 4060 Lav Mic',
    top_demographic: 'Men & Women 18-35',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'City Skyline Departure' },
      { second: 300, pct_retention: 86, chapter_name: 'Tunnel Sound Resonance', is_spike_point: true },
      { second: 700, pct_retention: 77, chapter_name: 'Late Night Coffee Stop' },
      { second: 1050, pct_retention: 68, chapter_name: 'Empty Expressway Pulls' },
      { second: 1260, pct_retention: 52, chapter_name: 'Garage Parking & Signoff' }
    ]
  },
  {
    video_id: 'ash_vid_10',
    channel_id: 'ashrides26_official',
    title: 'When the V4 VTEC kicks in on the highway 🚀 #motovlog',
    thumbnail_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
    category: 'shorts',
    bike_model: 'Ducati Panigale V4 S',
    duration_seconds: 42,
    upload_date: '2026-08-24',
    views: 2150000,
    likes: 241000,
    comments: 8910,
    retention_pct: 97.4,
    watch_time_hours: 25100,
    ctr_pct: 19.8,
    cpm_usd: 2.10,
    estimated_revenue_usd: 4515,
    velocity_views_per_hr: 5400,
    tags: ['V4 Sound', 'Acceleration', 'Desmosedici', 'POV', 'Shorts', 'Fast'],
    is_trending: true,
    trending_score: 100,
    audio_sound_profile: 'Desmosedici Stradale 1,103cc Screaming',
    top_demographic: 'Global Audience',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Cruising at 4000 RPM' },
      { second: 15, pct_retention: 99, chapter_name: 'Dropping to 2nd Gear' },
      { second: 25, pct_retention: 98, chapter_name: '10,000 to 15,000 RPM Redline Surge', is_spike_point: true },
      { second: 42, pct_retention: 94, chapter_name: 'Speedo Blur' }
    ]
  },
  {
    video_id: 'ash_vid_11',
    channel_id: 'ashrides26_official',
    title: 'Installing Titanium Full Exhaust on ZX-10R DIY in Garage (LOUD Flashes!)',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
    category: 'vlog',
    bike_model: 'Kawasaki Ninja ZX-10R',
    duration_seconds: 1680, // 28 mins
    upload_date: '2026-03-21',
    views: 398000,
    likes: 31200,
    comments: 2410,
    retention_pct: 58.7,
    watch_time_hours: 102000,
    ctr_pct: 8.9,
    cpm_usd: 7.90,
    estimated_revenue_usd: 3144,
    velocity_views_per_hr: 180,
    tags: ['DIY', 'Exhaust Install', 'Titanium Headers', 'ZX10R Mod', 'Garage Vlog', 'ECU Flash'],
    is_trending: false,
    trending_score: 58,
    audio_sound_profile: 'Direct Header Open Pipe vs Full Muffler',
    top_demographic: 'Motorcycle DIY Enthusiasts 25-45',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Unboxing Titanium Beauty' },
      { second: 350, pct_retention: 78, chapter_name: 'Removing OEM Cat & Headers' },
      { second: 800, pct_retention: 72, chapter_name: 'Torquing Flanges & O2 Sensor' },
      { second: 1300, pct_retention: 81, chapter_name: 'First Startup Flames 🔥', is_spike_point: true },
      { second: 1680, pct_retention: 44, chapter_name: 'Tool List & Tips' }
    ]
  },
  {
    video_id: 'ash_vid_12',
    channel_id: 'ashrides26_official',
    title: 'Aprilia RSV4 Factory 1100 Review: Italian V4 Screamer in the Canyons',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    category: 'bike_review',
    bike_model: 'Aprilia RSV4 Factory 1100',
    duration_seconds: 1210, // 20.1 mins
    upload_date: '2026-05-30',
    views: 612000,
    likes: 49800,
    comments: 3180,
    retention_pct: 67.9,
    watch_time_hours: 141000,
    ctr_pct: 10.9,
    cpm_usd: 7.60,
    estimated_revenue_usd: 4651,
    velocity_views_per_hr: 510,
    tags: ['Aprilia', 'RSV4 Factory', 'Ohlins Electronic Suspension', 'V4 Sound', 'Canyon Review'],
    is_trending: false,
    trending_score: 79,
    audio_sound_profile: 'Akrapovic Evolution Line (Pure Symphony)',
    top_demographic: 'Men 25-50',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Canyon Flyby Teaser' },
      { second: 220, pct_retention: 88, chapter_name: 'Aero Winglets & 217 HP Engine' },
      { second: 580, pct_retention: 81, chapter_name: 'Ohlins Semi-Active Ride Quality' },
      { second: 950, pct_retention: 73, chapter_name: 'RSV4 vs Panigale V4 Comparison' },
      { second: 1210, pct_retention: 51, chapter_name: 'Final Verdict' }
    ]
  },
  {
    video_id: 'ash_vid_13',
    channel_id: 'ashrides26_official',
    title: 'Biker wave etiquette vs Harley riders 😂 #shorts',
    thumbnail_url: 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?w=600&auto=format&fit=crop&q=80',
    category: 'shorts',
    bike_model: 'Yamaha YZF-R1M',
    duration_seconds: 28,
    upload_date: '2026-08-02',
    views: 3120000,
    likes: 382000,
    comments: 14200,
    retention_pct: 98.8,
    watch_time_hours: 24200,
    ctr_pct: 21.4,
    cpm_usd: 1.45,
    estimated_revenue_usd: 4524,
    velocity_views_per_hr: 3100,
    tags: ['Biker Wave', 'Harley Davidson', 'Sportbike vs Cruiser', 'Funny', 'Shorts', 'Motorcycle Community'],
    is_trending: true,
    trending_score: 97,
    audio_sound_profile: 'Helmet Intercom Comedy',
    top_demographic: 'All motorcycle riders worldwide',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Spotting Cruiser oncoming' },
      { second: 10, pct_retention: 99, chapter_name: 'Low Two-Finger Wave Gesture' },
      { second: 20, pct_retention: 98, chapter_name: 'The Awkward Ignored Stare 😂', is_spike_point: true },
      { second: 28, pct_retention: 96, chapter_name: 'Laughing in Helmet' }
    ]
  },
  {
    video_id: 'ash_vid_14',
    channel_id: 'ashrides26_official',
    title: 'Honda CBR1000RR-R Fireblade SP Track Test - Worth $29,000?',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    category: 'bike_review',
    bike_model: 'Honda CBR1000RR-R Fireblade SP',
    duration_seconds: 1380, // 23 mins
    upload_date: '2026-02-18',
    views: 470000,
    likes: 36100,
    comments: 2840,
    retention_pct: 63.4,
    watch_time_hours: 114000,
    ctr_pct: 9.1,
    cpm_usd: 7.10,
    estimated_revenue_usd: 3337,
    velocity_views_per_hr: 190,
    tags: ['Honda', 'Fireblade SP', 'CBR1000RRR', 'MotoGP Tech', 'Track Test', '215 HP'],
    is_trending: false,
    trending_score: 65,
    audio_sound_profile: 'OEM Titanium Akrapovic Canister',
    top_demographic: 'Men 25-45',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Fireblade Track Intro' },
      { second: 320, pct_retention: 84, chapter_name: 'MotoGP Derived Bore and Stroke' },
      { second: 720, pct_retention: 76, chapter_name: 'Tall 1st Gear Canyon Realities' },
      { second: 1100, pct_retention: 66, chapter_name: 'Brembo Stylema Brakes & Ohlins TTX' },
      { second: 1380, pct_retention: 47, chapter_name: 'Is it too Track-Focused?' }
    ]
  },
  {
    video_id: 'ash_vid_15',
    channel_id: 'ashrides26_official',
    title: 'Riding 600 Miles in Rain to MotoGP Circuit | Epic Roadtrip Vlog Part 1',
    thumbnail_url: 'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?w=600&auto=format&fit=crop&q=80',
    category: 'vlog',
    bike_model: 'Kawasaki Ninja ZX-10R',
    duration_seconds: 1540, // 25.6 mins
    upload_date: '2026-04-20',
    views: 380000,
    likes: 32400,
    comments: 2190,
    retention_pct: 60.2,
    watch_time_hours: 98000,
    ctr_pct: 8.4,
    cpm_usd: 6.40,
    estimated_revenue_usd: 2432,
    velocity_views_per_hr: 140,
    tags: ['Roadtrip', 'Rain Riding', 'MotoGP Trip', 'ZX10R Touring', 'Adventure Motovlog', 'Gore-Tex Gear'],
    is_trending: false,
    trending_score: 54,
    audio_sound_profile: 'Raindrops on Visor + Low RPM Drone',
    top_demographic: 'Touring & Sportbike Enthusiasts',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Packing Saddlebags on a Superbike' },
      { second: 300, pct_retention: 81, chapter_name: 'Torrential Downpour on Interstate' },
      { second: 800, pct_retention: 70, chapter_name: 'Gas Station Coffee & Wet Gloves' },
      { second: 1200, pct_retention: 64, chapter_name: 'Arriving at Circuit Campgrounds' },
      { second: 1540, pct_retention: 46, chapter_name: 'Part 2 Preview' }
    ]
  },
  {
    video_id: 'ash_vid_16',
    channel_id: 'ashrides26_official',
    title: 'Ducati Dry Clutch ASMR Sound Test 🎵 #motorcycle',
    thumbnail_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
    category: 'shorts',
    bike_model: 'Ducati Panigale V4 S',
    duration_seconds: 38,
    upload_date: '2026-08-18',
    views: 1680000,
    likes: 181000,
    comments: 5200,
    retention_pct: 95.8,
    watch_time_hours: 17700,
    ctr_pct: 16.9,
    cpm_usd: 1.70,
    estimated_revenue_usd: 2856,
    velocity_views_per_hr: 2450,
    tags: ['Ducati', 'Dry Clutch', 'STM Italy', 'ASMR', 'Clutch Rattle', 'Shorts'],
    is_trending: true,
    trending_score: 93,
    audio_sound_profile: 'STM SBK Dry Clutch Rattle Sound',
    top_demographic: 'Superbike Fanatics',
    retention_curve: [
      { second: 0, pct_retention: 100, chapter_name: 'Open Carbon Clutch Cover Close-up' },
      { second: 12, pct_retention: 97, chapter_name: 'Neutral Clutch Lever Pulled In (Quiet)' },
      { second: 22, pct_retention: 96, chapter_name: 'Lever Released (Tambourine of Speed! 🎵)', is_spike_point: true },
      { second: 38, pct_retention: 92, chapter_name: 'Quick Rev' }
    ]
  }
];

export const MONTHLY_GROWTH_DATA: MonthlyGrowth[] = [
  { month: 'Sep 25', year: 2025, views: 2410000, subscribers_gained: 16200, watch_time_hours: 198000, revenue_est: 13400, bike_review_views: 1200000, vlog_views: 760000, shorts_views: 450000 },
  { month: 'Oct 25', year: 2025, views: 2780000, subscribers_gained: 18900, watch_time_hours: 224000, revenue_est: 15200, bike_review_views: 1380000, vlog_views: 820000, shorts_views: 580000 },
  { month: 'Nov 25', year: 2025, views: 3120000, subscribers_gained: 21500, watch_time_hours: 258000, revenue_est: 17800, bike_review_views: 1520000, vlog_views: 890000, shorts_views: 710000 },
  { month: 'Dec 25', year: 2025, views: 3680000, subscribers_gained: 25400, watch_time_hours: 310000, revenue_est: 22100, bike_review_views: 1840000, vlog_views: 990000, shorts_views: 850000 },
  { month: 'Jan 26', year: 2026, views: 3450000, subscribers_gained: 22800, watch_time_hours: 289000, revenue_est: 18900, bike_review_views: 1650000, vlog_views: 920000, shorts_views: 880000 },
  { month: 'Feb 26', year: 2026, views: 3890000, subscribers_gained: 26400, watch_time_hours: 326000, revenue_est: 21400, bike_review_views: 1910000, vlog_views: 990000, shorts_views: 990000 },
  { month: 'Mar 26', year: 2026, views: 4210000, subscribers_gained: 28900, watch_time_hours: 358000, revenue_est: 24200, bike_review_views: 2050000, vlog_views: 1040000, shorts_views: 1120000 },
  { month: 'Apr 26', year: 2026, views: 4680000, subscribers_gained: 31800, watch_time_hours: 395000, revenue_est: 27100, bike_review_views: 2280000, vlog_views: 1120000, shorts_views: 1280000 },
  { month: 'May 26', year: 2026, views: 5120000, subscribers_gained: 34900, watch_time_hours: 432000, revenue_est: 29800, bike_review_views: 2480000, vlog_views: 1240000, shorts_views: 1400000 },
  { month: 'Jun 26', year: 2026, views: 5740000, subscribers_gained: 38400, watch_time_hours: 489000, revenue_est: 34200, bike_review_views: 2790000, vlog_views: 1350000, shorts_views: 1600000 },
  { month: 'Jul 26', year: 2026, views: 6320000, subscribers_gained: 42600, watch_time_hours: 538000, revenue_est: 38900, bike_review_views: 3080000, vlog_views: 1460000, shorts_views: 1780000 },
  { month: 'Aug 26', year: 2026, views: 7150000, subscribers_gained: 49200, watch_time_hours: 614000, revenue_est: 44800, bike_review_views: 3450000, vlog_views: 1620000, shorts_views: 2080000 }
];

export const INITIAL_TRENDING_ALERTS: TrendingAlert[] = [
  {
    id: 'alert_001',
    video_id: 'ash_vid_10',
    video_title: 'When the V4 VTEC kicks in on the highway 🚀 #motovlog',
    channel_name: 'AshRides26',
    category: 'shorts',
    alert_type: 'velocity_surge',
    multiplier: 4.8,
    metric_value: '5,400 views/hr (4.8x avg)',
    message: 'High Velocity Surge Detected! Viral algorithm push active across US & EU feeds.',
    timestamp: '5 mins ago',
    is_read: false,
    priority: 'critical'
  },
  {
    id: 'alert_002',
    video_id: 'ash_vid_04',
    video_title: 'R1M Crossplane Cold Start & Revs 🔥🔊 (Ear Protection Needed!)',
    channel_name: 'AshRides26',
    category: 'shorts',
    alert_type: 'retention_spike',
    multiplier: 1.4,
    metric_value: '94.6% Avg Retention',
    message: 'Retention Benchmark Exceeded: Replay index in segment 0:32 (Exhaust Blips) reached 142%.',
    timestamp: '28 mins ago',
    is_read: false,
    priority: 'high'
  },
  {
    id: 'alert_003',
    video_id: 'ash_vid_02',
    video_title: 'Yamaha R1M vs BMW S1000RR 2024 - Brutal Canyon Comparison Battle!',
    channel_name: 'AshRides26',
    category: 'bike_review',
    alert_type: 'milestone',
    metric_value: '1.24 Million Views',
    message: 'Milestone Unlocked: Surpassed 1,200,000 views and generated over $10,000 estimated revenue!',
    timestamp: '2 hours ago',
    is_read: true,
    priority: 'medium'
  },
  {
    id: 'alert_004',
    video_id: 'ash_vid_adv_01',
    channel_name: 'AshRides26',
    video_title: 'Motorcycle Adventure: Gainesville to Asheville NC - Mountain Twisties & Scenic Passes',
    category: 'vlog',
    alert_type: 'velocity_surge',
    multiplier: 3.4,
    metric_value: '+8.4k Views / 12h',
    message: 'Roadtrip Adventure Surge: High viewer engagement on the Gainesville to Asheville NC mountain twisties journey!',
    timestamp: '4 hours ago',
    is_read: true,
    priority: 'high'
  },
  {
    id: 'alert_005',
    video_id: 'ash_vid_01',
    video_title: '2024 Ducati Panigale V4 S Track Review - SC-Project Exhaust Sound',
    channel_name: 'AshRides26',
    category: 'bike_review',
    alert_type: 'velocity_surge',
    multiplier: 2.9,
    metric_value: '820 views/hr',
    message: 'External Traffic Wave: Reddit r/motorcycles featured the SC-Project exhaust sound clip.',
    timestamp: '6 hours ago',
    is_read: true,
    priority: 'medium'
  }
];

export const INITIAL_USER_ACCOUNT: UserAccount = {
  id: 'usr_ash_2602',
  name: 'Ash (AshRides26)',
  email: 'ash@ashrides26.motovlog',
  role: 'Channel Owner (Ash)',
  avatar: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80',
  last_login: 'Just now',
  created_at: '2021-04-12',
  connected_devices: [
    {
      id: 'dev_01',
      device_name: 'MacBook Pro 16" M3 Max (Studio Editing Rig)',
      device_type: 'desktop',
      os: 'macOS Sonoma 14.5',
      browser: 'Chrome 128.0',
      ip_location: 'Los Angeles, CA, USA',
      last_synced_at: '2 seconds ago',
      is_current: true,
      battery_level: 92
    },
    {
      id: 'dev_02',
      device_name: 'iPhone 15 Pro Max (Helmet Cam Telemetry Sync)',
      device_type: 'mobile',
      os: 'iOS 17.6',
      browser: 'Mobile Safari',
      ip_location: 'Los Angeles, CA, USA',
      last_synced_at: '4 minutes ago',
      is_current: false,
      battery_level: 78
    },
    {
      id: 'dev_03',
      device_name: 'Linux Workstation (DBMS Query & Video Transcode Engine)',
      device_type: 'desktop',
      os: 'Ubuntu 24.04 LTS',
      browser: 'Firefox Developer 129',
      ip_location: 'Los Angeles, CA, USA',
      last_synced_at: '18 minutes ago',
      is_current: false
    }
  ],
  saved_video_ids: ['ash_vid_01', 'ash_vid_02', 'ash_vid_10', 'ash_vid_04'],
  saved_comparisons: [
    ['ash_vid_01', 'ash_vid_02'],
    ['ash_vid_04', 'ash_vid_07', 'ash_vid_10']
  ],
  custom_queries: [
    {
      id: 'query_01',
      title: 'Top Retention vs Duration Correlation by Category',
      description: 'Calculates the Pearson coefficient between video length and retention % grouped by bike review, vlog, and shorts.',
      sql: `SELECT 
    v.category,
    COUNT(v.video_id) AS total_videos,
    ROUND(AVG(v.retention_pct), 2) AS avg_retention_pct,
    ROUND(AVG(v.duration_seconds), 1) AS avg_duration_sec,
    ROUND(AVG(v.watch_time_hours), 0) AS avg_watch_hours,
    ROUND(SUM(v.views) / SUM(v.duration_seconds), 2) AS view_density_factor
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE LOWER(c.handle) = '@ashrides26'
GROUP BY v.category
ORDER BY avg_retention_pct DESC;`,
      category: 'Aggregation',
      created_at: '2026-08-20'
    },
    {
      id: 'query_02',
      title: 'Window Function: 48-Hour Velocity Surge Rank & Outliers',
      description: 'Finds videos where current hourly velocity is 2.5x greater than the 30-day moving average velocity.',
      sql: `WITH VelocityStats AS (
    SELECT 
        video_id,
        title,
        category,
        velocity_views_per_hr,
        AVG(velocity_views_per_hr) OVER(PARTITION BY category) AS cat_avg_velocity,
        PERCENT_RANK() OVER(ORDER BY velocity_views_per_hr DESC) AS velocity_percentile
    FROM fact_video_metrics
    WHERE channel_id = 'ashrides26_official'
)
SELECT 
    video_id,
    title,
    category,
    velocity_views_per_hr,
    ROUND(cat_avg_velocity, 1) AS category_benchmark,
    ROUND(velocity_views_per_hr / NULLIF(cat_avg_velocity, 0), 2) AS surge_multiplier,
    ROUND(velocity_percentile * 100, 1) AS top_percentile_rank
FROM VelocityStats
WHERE velocity_views_per_hr > (cat_avg_velocity * 1.8)
ORDER BY surge_multiplier DESC;`,
      category: 'Window Functions',
      created_at: '2026-08-24'
    },
    {
      id: 'query_03',
      title: '@ashrides26 Content Pillar & Adventure Series Performance',
      description: 'Aggregates metrics by category and bike model to identify the highest-converting video formats and viewer retention.',
      sql: `SELECT 
    v.category,
    v.bike_model,
    COUNT(v.video_id) AS video_count,
    ROUND(AVG(v.views), 0) AS avg_views,
    ROUND(AVG(v.retention_pct), 1) AS avg_retention_pct,
    ROUND(AVG(v.ctr_pct), 1) AS avg_ctr_pct,
    ROUND(SUM(v.estimated_revenue_usd), 2) AS total_revenue_usd
FROM fact_video_metrics v
JOIN dim_channels c ON v.channel_id = c.channel_id
WHERE c.handle = '@ashrides26'
GROUP BY v.category, v.bike_model
ORDER BY avg_views DESC;`,
      category: 'Cross-Table Joins',
      created_at: '2026-08-26'
    }
  ],
  notification_settings: {
    velocity_alerts: true,
    retention_milestones: true,
    viral_shorts: true,
    competitor_tracking: true,
    browser_push_enabled: true,
    sound_alerts_enabled: true,
    velocity_threshold_multiplier: 2.5
  }
};

export const DBMS_SCHEMA = [
  {
    table_name: 'dim_channels',
    description: 'Dimension table storing motovlogger channel profiles, bikes, and subscriber benchmarks.',
    primary_key: 'channel_id (VARCHAR(64))',
    indexes: ['idx_channel_handle (UNIQUE)', 'idx_channel_subs (BTREE)'],
    row_count: 7,
    columns: [
      { name: 'channel_id', type: 'VARCHAR(64)', constraint: 'PRIMARY KEY' },
      { name: 'name', type: 'VARCHAR(128)', constraint: 'NOT NULL' },
      { name: 'handle', type: 'VARCHAR(64)', constraint: 'UNIQUE' },
      { name: 'subscribers', type: 'INT', constraint: 'DEFAULT 0' },
      { name: 'total_views', type: 'BIGINT', constraint: 'DEFAULT 0' },
      { name: 'total_videos', type: 'INT', constraint: 'DEFAULT 0' },
      { name: 'primary_bike', type: 'VARCHAR(128)', constraint: 'NULLABLE' },
      { name: 'joined_date', type: 'DATE', constraint: 'NOT NULL' }
    ]
  },
  {
    table_name: 'fact_video_metrics',
    description: 'Central fact table tracking granular performance, retention %, revenue, and velocity.',
    primary_key: 'video_id (VARCHAR(64))',
    foreign_keys: ['channel_id -> dim_channels.channel_id'],
    indexes: ['idx_video_upload_date (BTREE)', 'idx_video_cat_retention (COMPOSITE)', 'idx_velocity (BTREE)'],
    row_count: 148,
    columns: [
      { name: 'video_id', type: 'VARCHAR(64)', constraint: 'PRIMARY KEY' },
      { name: 'channel_id', type: 'VARCHAR(64)', constraint: 'FK -> dim_channels' },
      { name: 'title', type: 'VARCHAR(255)', constraint: 'NOT NULL' },
      { name: 'category', type: 'ENUM(bike_review, vlog, shorts)', constraint: 'NOT NULL' },
      { name: 'bike_model', type: 'VARCHAR(128)', constraint: 'NULLABLE' },
      { name: 'duration_seconds', type: 'INT', constraint: 'NOT NULL' },
      { name: 'upload_date', type: 'TIMESTAMP', constraint: 'NOT NULL' },
      { name: 'views', type: 'BIGINT', constraint: 'NOT NULL' },
      { name: 'likes', type: 'INT', constraint: 'NOT NULL' },
      { name: 'comments', type: 'INT', constraint: 'NOT NULL' },
      { name: 'retention_pct', type: 'DECIMAL(5,2)', constraint: 'NOT NULL' },
      { name: 'watch_time_hours', type: 'BIGINT', constraint: 'NOT NULL' },
      { name: 'velocity_views_per_hr', type: 'INT', constraint: 'DEFAULT 0' }
    ]
  },
  {
    table_name: 'retention_timeseries',
    description: 'High-frequency time-series table tracking second-by-second viewer attention and chapter dropoffs.',
    primary_key: '(video_id, second_mark)',
    foreign_keys: ['video_id -> fact_video_metrics.video_id'],
    indexes: ['idx_retention_video (BTREE, PARTITIONED BY RANGE)'],
    row_count: 14280,
    columns: [
      { name: 'video_id', type: 'VARCHAR(64)', constraint: 'COMPOSITE PK' },
      { name: 'second_mark', type: 'INT', constraint: 'COMPOSITE PK' },
      { name: 'pct_retention', type: 'DECIMAL(5,2)', constraint: 'NOT NULL' },
      { name: 'chapter_name', type: 'VARCHAR(128)', constraint: 'NULLABLE' },
      { name: 'is_spike_point', type: 'BOOLEAN', constraint: 'DEFAULT FALSE' }
    ]
  },
  {
    table_name: 'dim_user_device_sync',
    description: 'Cross-device replication table storing sync checkpoints, session tokens, and telemetry locks.',
    primary_key: 'device_session_id (UUID)',
    foreign_keys: ['user_id -> dim_user_accounts.user_id'],
    indexes: ['idx_user_active_sessions (BTREE)', 'idx_sync_timestamp (BTREE)'],
    row_count: 3,
    columns: [
      { name: 'device_session_id', type: 'UUID', constraint: 'PRIMARY KEY' },
      { name: 'user_id', type: 'VARCHAR(64)', constraint: 'FK' },
      { name: 'device_name', type: 'VARCHAR(128)', constraint: 'NOT NULL' },
      { name: 'last_synced_at', type: 'TIMESTAMP', constraint: 'NOT NULL' },
      { name: 'sync_payload_hash', type: 'CHAR(64)', constraint: 'NOT NULL' }
    ]
  }
];
