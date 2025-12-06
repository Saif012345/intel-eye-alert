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

    // Note: Admin role check removed for demo purposes
    // In production, you should check for admin role here
    console.log(`Sync triggered by user: ${user.id}`);

    console.log('Starting threat intelligence sync...');
    
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const otxApiKey = Deno.env.get('ALIENVAULT_OTX_API_KEY')!;
    const shodanApiKey = Deno.env.get('SHODAN_API_KEY');
    const abuseipdbApiKey = Deno.env.get('ABUSEIPDB_API_KEY');
    
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
        'https://otx.alienvault.com/api/v1/pulses/subscribed?limit=50',
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
            tags.includes('exploit') ? 'exploit' :
            tags.includes('ransomware') ? 'ransomware' :
            tags.some((t: string) => t.toLowerCase().includes('apt')) ? 'apt' : 'threat';
          
          const searchText = `${pulse.name} ${pulse.description || ''} ${tags.join(' ')}`;
          const country = extractCountry(searchText);
          
          // Add main pulse as threat
          threats.push({
            threat_type: threatType,
            severity,
            title: pulse.name.substring(0, 200),
            description: pulse.description?.substring(0, 500) || 'No description available',
            source: 'AlienVault OTX',
            indicator: null,
            country,
          });
          
          // Add IOCs (Indicators of Compromise) as separate threats
          if (pulse.indicators && pulse.indicators.length > 0) {
            const iocLimit = 10; // Limit IOCs per pulse to avoid too many entries
            for (const ioc of pulse.indicators.slice(0, iocLimit)) {
              const iocType = ioc.type === 'IPv4' || ioc.type === 'IPv6' ? 'malicious-ip' :
                ioc.type === 'domain' ? 'malicious-domain' :
                ioc.type === 'FileHash-MD5' || ioc.type === 'FileHash-SHA256' ? 'malware-hash' :
                'ioc';
              
              threats.push({
                threat_type: iocType,
                severity: severity,
                title: `${ioc.type}: ${ioc.indicator.substring(0, 100)}`,
                description: `IOC from pulse: ${pulse.name}`,
                source: 'AlienVault OTX - IOC',
                indicator: ioc.indicator,
                country,
              });
            }
          }
        }
      } else {
        console.error(`OTX API error: ${otxResponse.status} ${otxResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching OTX data:', error);
    }
    
    // 3. Fetch IP reputation data from AbuseIPDB
    if (abuseipdbApiKey) {
      console.log('Fetching IP reputation data from AbuseIPDB...');
      try {
        const abuseResponse = await fetch(
          'https://api.abuseipdb.com/api/v2/blacklist?limit=50&confidenceMinimum=90',
          {
            headers: {
              'Key': abuseipdbApiKey,
              'Accept': 'application/json',
            }
          }
        );
        
        if (abuseResponse.ok) {
          const abuseData = await abuseResponse.json();
          const blacklistedIPs = abuseData.data || [];
          
          console.log(`Found ${blacklistedIPs.length} blacklisted IPs from AbuseIPDB`);
          
          for (const ipData of blacklistedIPs.slice(0, 30)) {
            const ip = ipData.ipAddress || 'Unknown';
            const abuseScore = ipData.abuseConfidenceScore || 0;
            const countryCode = ipData.countryCode || 'Unknown';
            
            let severity = 'medium';
            if (abuseScore >= 90) severity = 'critical';
            else if (abuseScore >= 70) severity = 'high';
            
            threats.push({
              threat_type: 'malicious-ip',
              severity,
              title: `Malicious IP: ${ip}`,
              description: `Abuse Confidence Score: ${abuseScore}%. Country: ${countryCode}. Reported for malicious activities.`,
              source: 'AbuseIPDB',
              indicator: ip,
              country: countryCode === 'NG' ? 'Nigeria' : null,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching AbuseIPDB data:', error);
      }
    }
    
    // 4. Fetch exposed devices from Shodan
    if (shodanApiKey) {
      console.log('Fetching exposed devices from Shodan...');
      try {
        // Search for devices with common vulnerabilities in Nigeria
        const shodanQueries = [
          'country:NG',  // All devices in Nigeria
          'country:NG port:22',  // SSH services
          'country:NG port:3389',  // RDP services
          'country:NG port:445',  // SMB services
        ];
        
        for (const query of shodanQueries) {
          try {
            const shodanResponse = await fetch(
              `https://api.shodan.io/shodan/host/search?key=${shodanApiKey}&query=${encodeURIComponent(query)}&minify=true`,
              {
                headers: {
                  'Accept': 'application/json',
                }
              }
            );
            
            if (shodanResponse.ok) {
              const shodanData = await shodanResponse.json();
              const matches = shodanData.matches || [];
              
              console.log(`Found ${matches.length} Shodan results for query: ${query}`);
              
              // Limit to 20 results per query to avoid too much data
              for (const match of matches.slice(0, 20)) {
                const ip = match.ip_str || 'Unknown';
                const port = match.port || 0;
                const org = match.org || 'Unknown';
                const isp = match.isp || 'Unknown';
                const vulns = match.vulns || [];
                
                // Determine severity based on vulnerabilities and open ports
                let severity = 'medium';
                if (vulns.length > 0) {
                  severity = 'critical';
                } else if ([22, 3389, 445, 23].includes(port)) {
                  severity = 'high';  // Potentially dangerous ports
                }
                
                const threatType = port === 22 ? 'exposed-ssh' :
                  port === 3389 ? 'exposed-rdp' :
                  port === 445 ? 'exposed-smb' :
                  port === 23 ? 'exposed-telnet' :
                  'exposed-device';
                
                const vulnsList = vulns.length > 0 ? ` Vulnerabilities: ${vulns.join(', ')}` : '';
                
                threats.push({
                  threat_type: threatType,
                  severity,
                  title: `Exposed ${match.product || 'Device'} on ${ip}:${port}`,
                  description: `Organization: ${org}, ISP: ${isp}.${vulnsList}`,
                  source: 'Shodan',
                  indicator: ip,
                  country: 'Nigeria',
                });
              }
            } else {
              console.error(`Shodan API error for query "${query}": ${shodanResponse.status} ${shodanResponse.statusText}`);
            }
            
            // Rate limiting - wait 1 second between queries
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (queryError) {
            console.error(`Error with Shodan query "${query}":`, queryError);
          }
        }
      } catch (error) {
        console.error('Error fetching Shodan data:', error);
      }
    } else {
      console.log('Shodan API key not configured, skipping Shodan integration');
    }
    
    // 5. Insert threats into database
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
        message: `Successfully synced ${threats.length} threats from NVD, AlienVault OTX${abuseipdbApiKey ? ', AbuseIPDB' : ''}${shodanApiKey ? ', and Shodan' : ''}`
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
