import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CVEItem {
  cve: {
    id: string;
    metrics?: {
      cvssMetricV31?: Array<{
        cvssData: {
          baseScore: number;
          baseSeverity: string;
        };
      }>;
    };
    descriptions?: Array<{
      lang: string;
      value: string;
    }>;
  };
}

interface OTXPulse {
  name: string;
  description: string;
  tags: string[];
  indicators?: Array<{
    type: string;
    indicator: string;
  }>;
  tlp?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting threat intelligence sync...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const otxApiKey = Deno.env.get('ALIENVAULT_OTX_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const threats: any[] = [];
    
    // Helper function to extract country from text
    const extractCountry = (text: string): string | null => {
      const nigeriaKeywords = ['nigeria', 'nigerian', 'lagos', 'abuja', 'ng', 'naija'];
      const lowerText = text.toLowerCase();
      
      if (nigeriaKeywords.some(keyword => lowerText.includes(keyword))) {
        return 'Nigeria';
      }
      
      // Add more countries as needed
      return null;
    };
    
    // 1. Fetch recent CVEs from NVD
    console.log('Fetching CVEs from NVD...');
    try {
      const nvdResponse = await fetch(
        'https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=20',
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (nvdResponse.ok) {
        const nvdData = await nvdResponse.json();
        const cveItems: CVEItem[] = nvdData.vulnerabilities || [];
        
        console.log(`Found ${cveItems.length} CVEs`);
        
        for (const item of cveItems) {
          const cve = item.cve;
          const metrics = cve.metrics?.cvssMetricV31?.[0];
          const description = cve.descriptions?.find((d: any) => d.lang === 'en')?.value || 'No description available';
          
          const baseScore = metrics?.cvssData?.baseScore || 5.0;
          const severity = metrics?.cvssData?.baseSeverity?.toLowerCase() || 
            (baseScore >= 9.0 ? 'critical' : baseScore >= 7.0 ? 'high' : baseScore >= 4.0 ? 'medium' : 'low');
          
          const country = extractCountry(description);
          
          threats.push({
            threat_type: 'vulnerability',
            severity: severity,
            title: cve.id || 'Unknown CVE',
            description: description.substring(0, 500),
            source: 'NVD',
            indicator: cve.id,
            country,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching NVD data:', error);
    }
    
    // 2. Fetch threat intelligence from AlienVault OTX
    console.log('Fetching pulses from AlienVault OTX...');
    try {
      const otxResponse = await fetch(
        'https://otx.alienvault.com/api/v1/pulses/subscribed?limit=20',
        {
          headers: {
            'X-OTX-API-KEY': otxApiKey,
            'Accept': 'application/json',
          }
        }
      );
      
      if (otxResponse.ok) {
        const otxData = await otxResponse.json();
        const pulses: OTXPulse[] = otxData.results || [];
        
        console.log(`Found ${pulses.length} OTX pulses`);
        
        for (const pulse of pulses) {
          const tags = pulse.tags || [];
          const hasHighThreat = tags.some((t: string) => 
            t.toLowerCase().includes('apt') || 
            t.toLowerCase().includes('ransomware') ||
            t.toLowerCase().includes('critical')
          );
          
          const severity = hasHighThreat ? 'critical' : 
            tags.some((t: string) => t.toLowerCase().includes('malware')) ? 'high' : 'medium';
          
          const threatType = tags.includes('malware') ? 'malware' :
            tags.includes('phishing') ? 'phishing' :
            tags.includes('exploit') ? 'exploit' : 'threat';
          
          const indicator = pulse.indicators?.[0]?.indicator || null;
          
          const searchText = `${pulse.name} ${pulse.description || ''} ${tags.join(' ')}`;
          const country = extractCountry(searchText);
          
          threats.push({
            threat_type: threatType,
            severity,
            title: pulse.name.substring(0, 200),
            description: pulse.description?.substring(0, 500) || 'No description available',
            source: 'AlienVault OTX',
            indicator,
            country,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching OTX data:', error);
    }
    
    // 3. Insert threats into database
    console.log(`Inserting ${threats.length} threats into database...`);
    
    if (threats.length > 0) {
      const { data, error } = await supabase
        .from('threats')
        .insert(threats)
        .select();
      
      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log(`Successfully inserted ${data?.length || 0} threats`);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        threatsAdded: threats.length,
        message: `Successfully synced ${threats.length} threats from NVD and AlienVault OTX`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error in sync-threat-intelligence:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
