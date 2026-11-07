// =======================================================
// SUPABASE CLIENT FOR DEMON SOVEREIGN'S BLOODLINE
// Dynamic Episodes, Panels, Realtime Likes & Comments
// =======================================================

(function () {
  let supabase = null;

  function initClient() {
    const url = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_url') : '');
    const anonKey = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_anon_key') : '');

    if (window.supabase && url && anonKey) {
      try {
        supabase = window.supabase.createClient(url, anonKey);
        console.log('[Supabase] Connected successfully to:', url);
      } catch (err) {
        console.warn('[Supabase] Initialization error:', err);
      }
    }
  }

  // Fallback local panels when offline or before Supabase credentials are added
  const LOCAL_EPISODE_1 = {
    id: 'local-ep-1',
    episode_number: 1,
    title: 'Episode 1: The Gathering Storm',
    likes_count: 1000000,
    comments_count: 200000,
    views_count: 4500000,
    panels: [
      { panel_number: 1, image_url: './panels/panel_01_final.png?v=6.3', alt_text: 'Saint Mirren International University' },
      { panel_number: 2, image_url: './panels/panel_02_final.png?v=6.3', alt_text: 'Dark Reality and Statistics' },
      { panel_number: 3, image_url: './panels/panel_03_final.png?v=6.3', alt_text: 'The Rooftop Beating' },
      { panel_number: 4, image_url: './panels/panel_04_final.png?v=6.3', alt_text: 'Eyes in the Sky' },
      { panel_number: 5, image_url: './panels/panel_05_final.png?v=6.3', alt_text: 'The Hex of Weakness' },
      { panel_number: 6, image_url: './panels/panel_06_final.png?v=6.3', alt_text: 'The Bullies Retreat' },
      { panel_number: 7, image_url: './panels/panel_07_final.png?v=6.3', alt_text: 'Grand Climax Cliffhanger' }
    ]
  };

  window.ManhwaAPI = {
    isConfigured: function () {
      return !!(supabase);
    },

    // Fetch single episode with all its panels
    fetchEpisode: async function (episodeNum = 1) {
      if (!supabase) {
        return LOCAL_EPISODE_1;
      }

      try {
        const { data: ep, error: epErr } = await supabase
          .from('episodes')
          .select('*')
          .eq('episode_number', episodeNum)
          .single();

        if (epErr || !ep) throw epErr || new Error('Episode not found');

        const { data: panels, error: pErr } = await supabase
          .from('panels')
          .select('*')
          .eq('episode_id', ep.id)
          .order('panel_number', { ascending: true });

        if (pErr) throw pErr;

        return {
          ...ep,
          panels: panels || []
        };
      } catch (err) {
        console.warn('[Supabase] Falling back to local data:', err.message);
        return LOCAL_EPISODE_1;
      }
    },

    // Fetch all published episodes
    fetchAllEpisodes: async function () {
      if (!supabase) {
        return [
          { episode_number: 1, title: 'Episode 1: The Gathering Storm', is_published: true },
          { episode_number: 2, title: 'Episode 2: Bloodline Awaken', is_published: false }
        ];
      }

      const { data, error } = await supabase
        .from('episodes')
        .select('id, episode_number, title, is_published, likes_count, comments_count')
        .order('episode_number', { ascending: true });

      if (error) {
        console.warn('[Supabase] Error fetching episodes:', error);
        return [LOCAL_EPISODE_1];
      }
      return data;
    },

    // Real-time Like increment
    addLike: async function (episodeId) {
      if (!supabase || !episodeId || episodeId === 'local-ep-1') {
        return true;
      }

      const { error } = await supabase
        .from('likes')
        .insert([{ episode_id: episodeId }]);

      return !error;
    },

    // Fetch comments for an episode
    fetchComments: async function (episodeId) {
      if (!supabase || !episodeId || episodeId === 'local-ep-1') {
        return [
          { user_name: 'ShadowMonarch', content: 'The cliffhanger with Kuro is insane!! Need episode 2 now!', created_at: '2 hours ago' },
          { user_name: 'SoloReader', content: 'REDICE Studio art style never disappoints. Ha-Jun is about to awaken!', created_at: '4 hours ago' }
        ];
      }

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('episode_id', episodeId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) return [];
      return data;
    },

    // Post comment
    postComment: async function (episodeId, userName, content) {
      if (!supabase || !episodeId || episodeId === 'local-ep-1') {
        return { user_name: userName || 'Anonymous', content, created_at: 'Just now' };
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([{ episode_id: episodeId, user_name: userName, content }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Admin: Create New Episode
    createEpisode: async function (episodeNumber, title) {
      if (!supabase) throw new Error('Supabase is not configured yet');

      // Get series id
      const { data: series } = await supabase
        .from('series')
        .select('id')
        .eq('slug', window.SUPABASE_CONFIG.seriesSlug || 'demon-sovereign-bloodline')
        .single();

      const seriesId = series ? series.id : null;

      const { data, error } = await supabase
        .from('episodes')
        .insert([{
          series_id: seriesId,
          episode_number: episodeNumber,
          title: title,
          is_published: true
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    // Admin: Add Panel to Episode
    addPanel: async function (episodeId, panelNumber, imageUrl, altText = '') {
      if (!supabase) throw new Error('Supabase is not configured yet');

      const { data, error } = await supabase
        .from('panels')
        .insert([{
          episode_id: episodeId,
          panel_number: panelNumber,
          image_url: imageUrl,
          alt_text: altText
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  // Auto init
  window.addEventListener('DOMContentLoaded', initClient);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initClient();
  }
})();
