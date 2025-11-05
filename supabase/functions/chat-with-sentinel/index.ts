import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Chat request received:', { message, historyLength: conversationHistory?.length || 0 });

    // Tool functions
    const tools = [
      {
        type: "function",
        function: {
          name: "search_threats",
          description: "Search for threats in the database using natural language queries. Can filter by severity, type, country, or keywords.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Search query or keywords" },
              severity: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Filter by severity level" },
              threat_type: { type: "string", description: "Filter by threat type (e.g., malware, phishing, ransomware)" },
              country: { type: "string", description: "Filter by country" },
              limit: { type: "number", description: "Maximum number of results (default 10)" }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_critical_threats",
          description: "Get the latest critical and high severity threats from the database",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of threats to retrieve (default 5)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_threat",
          description: "Trigger AI analysis on a specific threat by its ID to get detailed insights",
          parameters: {
            type: "object",
            properties: {
              threat_id: { type: "string", description: "The UUID of the threat to analyze" }
            },
            required: ["threat_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "find_related_threats",
          description: "Find threats related to a specific threat based on type, severity, or indicators",
          parameters: {
            type: "object",
            properties: {
              threat_id: { type: "string", description: "The UUID of the threat to find relations for" },
              limit: { type: "number", description: "Maximum number of related threats (default 5)" }
            },
            required: ["threat_id"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_threat_statistics",
          description: "Get statistics and summary of threats in the database",
          parameters: {
            type: "object",
            properties: {
              time_period: { type: "string", enum: ["today", "week", "month", "all"], description: "Time period for stats" }
            }
          }
        }
      }
    ];

    // Execute tool function
    const executeTool = async (toolName: string, args: any) => {
      console.log('Executing tool:', toolName, args);

      switch (toolName) {
        case 'search_threats': {
          let query = supabase.from('threats').select('*');
          
          if (args.severity) query = query.eq('severity', args.severity);
          if (args.threat_type) query = query.ilike('threat_type', `%${args.threat_type}%`);
          if (args.country) query = query.ilike('country', `%${args.country}%`);
          if (args.query) {
            query = query.or(`title.ilike.%${args.query}%,description.ilike.%${args.query}%`);
          }
          
          query = query.order('created_at', { ascending: false }).limit(args.limit || 10);
          const { data, error } = await query;
          
          if (error) throw error;
          return { threats: data, count: data?.length || 0 };
        }

        case 'get_critical_threats': {
          const { data, error } = await supabase
            .from('threats')
            .select('*')
            .in('severity', ['critical', 'high'])
            .order('created_at', { ascending: false })
            .limit(args.limit || 5);
          
          if (error) throw error;
          return { threats: data, count: data?.length || 0 };
        }

        case 'analyze_threat': {
          const { data: threat, error } = await supabase
            .from('threats')
            .select('*')
            .eq('id', args.threat_id)
            .single();
          
          if (error) throw error;
          return { threat, has_analysis: !!threat.ai_summary };
        }

        case 'find_related_threats': {
          const { data: sourceThreat, error: threatError } = await supabase
            .from('threats')
            .select('*')
            .eq('id', args.threat_id)
            .single();
          
          if (threatError) throw threatError;

          const { data, error } = await supabase
            .from('threats')
            .select('*')
            .neq('id', args.threat_id)
            .or(`threat_type.eq.${sourceThreat.threat_type},severity.eq.${sourceThreat.severity}`)
            .order('created_at', { ascending: false })
            .limit(args.limit || 5);
          
          if (error) throw error;
          return { related_threats: data, source_threat: sourceThreat, count: data?.length || 0 };
        }

        case 'get_threat_statistics': {
          let query = supabase.from('threats').select('severity, threat_type, country, created_at');
          
          const now = new Date();
          if (args.time_period === 'today') {
            const today = new Date(now.setHours(0, 0, 0, 0));
            query = query.gte('created_at', today.toISOString());
          } else if (args.time_period === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            query = query.gte('created_at', weekAgo.toISOString());
          } else if (args.time_period === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            query = query.gte('created_at', monthAgo.toISOString());
          }
          
          const { data, error } = await query;
          if (error) throw error;

          // Calculate statistics
          const stats = {
            total: data?.length || 0,
            by_severity: {} as any,
            by_type: {} as any,
            by_country: {} as any,
          };

          data?.forEach(threat => {
            stats.by_severity[threat.severity] = (stats.by_severity[threat.severity] || 0) + 1;
            stats.by_type[threat.threat_type] = (stats.by_type[threat.threat_type] || 0) + 1;
            if (threat.country) {
              stats.by_country[threat.country] = (stats.by_country[threat.country] || 0) + 1;
            }
          });

          return stats;
        }

        default:
          return { error: 'Unknown tool' };
      }
    };

    const messages = [
      {
        role: 'system',
        content: `You are SentinelBot, an advanced AI cybersecurity assistant with access to a live threat intelligence database. 

Your enhanced capabilities:
- Access and query real-time threat data from the database
- Search for specific threats by keywords, severity, type, or country
- Analyze threat patterns and correlations
- Provide statistics and summaries of current threats
- Find related threats and identify attack chains
- Explain cybersecurity concepts and provide remediation guidance

Available tools:
- search_threats: Search the database for specific threats
- get_critical_threats: Retrieve latest high-priority threats
- analyze_threat: Get detailed AI analysis of a specific threat
- find_related_threats: Discover related threats to identify patterns
- get_threat_statistics: Get overview statistics of the threat landscape

When users ask about threats, actively use your tools to provide accurate, data-driven responses from the live database.
Be proactive: if someone asks a general question, offer to search the database for specific examples.
Keep responses professional, clear, and actionable with concrete data.`
      },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // First AI call with tools
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway returned ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Check if AI wants to use tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('AI requested tool calls:', assistantMessage.tool_calls.length);

      // Execute all tool calls
      const toolResults = [];
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        try {
          const result = await executeTool(toolName, toolArgs);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolName,
            content: JSON.stringify(result)
          });
        } catch (error) {
          console.error(`Tool ${toolName} failed:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolName,
            content: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
          });
        }
      }

      // Second AI call with tool results
      const followUpMessages = [
        ...messages,
        assistantMessage,
        ...toolResults
      ];

      const followUpResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: followUpMessages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!followUpResponse.ok) {
        throw new Error(`Follow-up AI call failed: ${followUpResponse.status}`);
      }

      const followUpData = await followUpResponse.json();
      const finalResponse = followUpData.choices[0].message.content;

      console.log('Bot response with tool results generated');

      return new Response(
        JSON.stringify({ 
          response: finalResponse,
          tools_used: assistantMessage.tool_calls.map((tc: any) => tc.function.name)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No tools needed, return direct response
    console.log('Bot response generated successfully');

    return new Response(
      JSON.stringify({ response: assistantMessage.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});