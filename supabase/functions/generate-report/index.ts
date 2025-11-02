import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { filters } = await req.json();
    
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('threats').select('*');

    // Apply filters
    if (filters.severity && filters.severity.length > 0) {
      query = query.in('severity', filters.severity);
    }
    if (filters.threatType && filters.threatType.length > 0) {
      query = query.in('threat_type', filters.threatType);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,indicator.ilike.%${filters.search}%`);
    }

    const { data: threats, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Generate HTML report
    const reportHtml = generateHtmlReport(threats, filters);

    return new Response(reportHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': 'attachment; filename="threat-report.html"'
      },
    });

  } catch (error) {
    console.error('Error in generate-report function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateHtmlReport(threats: any[], filters: any): string {
  const now = new Date().toLocaleString();
  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#10b981'
  };

  const threatsHtml = threats.map(threat => `
    <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #374151; border-radius: 8px; background: #1f2937;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <h3 style="margin: 0; color: #f3f4f6; font-size: 18px;">${threat.title}</h3>
        <span style="padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; background: ${severityColors[threat.severity]}; color: white;">
          ${threat.severity.toUpperCase()}
        </span>
      </div>
      <p style="color: #9ca3af; margin: 8px 0;"><strong>Type:</strong> ${threat.threat_type}</p>
      <p style="color: #9ca3af; margin: 8px 0;"><strong>Source:</strong> ${threat.source}</p>
      ${threat.indicator ? `<p style="color: #9ca3af; margin: 8px 0;"><strong>Indicator:</strong> ${threat.indicator}</p>` : ''}
      ${threat.country ? `<p style="color: #9ca3af; margin: 8px 0;"><strong>Country:</strong> ${threat.country}</p>` : ''}
      <p style="color: #d1d5db; margin: 12px 0;">${threat.description || 'No description available'}</p>
      ${threat.ai_summary ? `
        <div style="margin-top: 12px; padding: 12px; background: #111827; border-radius: 4px;">
          <p style="color: #60a5fa; font-weight: bold; margin: 0 0 8px 0;">AI Summary</p>
          <p style="color: #d1d5db; margin: 0;">${threat.ai_summary}</p>
        </div>
      ` : ''}
      ${threat.risk_insight ? `
        <div style="margin-top: 8px; padding: 12px; background: #111827; border-radius: 4px;">
          <p style="color: #f59e0b; font-weight: bold; margin: 0 0 8px 0;">Risk Insight</p>
          <p style="color: #d1d5db; margin: 0;">${threat.risk_insight}</p>
        </div>
      ` : ''}
      <p style="color: #6b7280; font-size: 12px; margin: 12px 0 0 0;">
        Detected: ${new Date(threat.created_at).toLocaleString()}
      </p>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SentinelEye Threat Intelligence Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #f3f4f6;
      padding: 40px;
      margin: 0;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .filters {
      background: #1e293b;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    @media print {
      body { background: white; color: black; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 8px 0; color: #3b82f6;">🛡️ SentinelEye</h1>
      <h2 style="margin: 0; color: #f3f4f6; font-weight: normal;">Threat Intelligence Report</h2>
      <p style="color: #9ca3af; margin: 8px 0 0 0;">Generated: ${now}</p>
    </div>

    <div class="filters">
      <h3 style="margin: 0 0 12px 0; color: #f3f4f6;">Report Filters</h3>
      <p style="margin: 4px 0; color: #9ca3af;">
        ${filters.severity?.length > 0 ? `<strong>Severity:</strong> ${filters.severity.join(', ')}` : 'All severities'}
      </p>
      <p style="margin: 4px 0; color: #9ca3af;">
        ${filters.threatType?.length > 0 ? `<strong>Type:</strong> ${filters.threatType.join(', ')}` : 'All types'}
      </p>
      ${filters.startDate ? `<p style="margin: 4px 0; color: #9ca3af;"><strong>From:</strong> ${filters.startDate}</p>` : ''}
      ${filters.endDate ? `<p style="margin: 4px 0; color: #9ca3af;"><strong>To:</strong> ${filters.endDate}</p>` : ''}
      <p style="margin: 8px 0 0 0; color: #f3f4f6;"><strong>Total Threats:</strong> ${threats.length}</p>
    </div>

    <div>
      <h3 style="color: #f3f4f6; margin-bottom: 16px;">Threat Details</h3>
      ${threatsHtml || '<p style="color: #9ca3af;">No threats found matching the filters.</p>'}
    </div>
  </div>
</body>
</html>`;
}