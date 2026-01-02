import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map state codes to area codes
const stateAreaCodes: Record<string, string[]> = {
  'AL': ['205', '251', '256', '334'],
  'AK': ['907'],
  'AZ': ['480', '520', '602', '623'],
  'AR': ['479', '501', '870'],
  'CA': ['209', '213', '310', '415', '510', '562', '619', '626', '650', '714', '760', '805', '818', '909', '916', '925', '949'],
  'CO': ['303', '719', '720', '970'],
  'CT': ['203', '475', '860', '959'],
  'DE': ['302'],
  'FL': ['239', '305', '321', '352', '386', '407', '561', '727', '754', '772', '786', '813', '850', '863', '904', '941', '954'],
  'GA': ['229', '404', '470', '478', '678', '706', '762', '770', '912'],
  'HI': ['808'],
  'ID': ['208'],
  'IL': ['217', '224', '309', '312', '331', '618', '630', '708', '773', '815', '847', '872'],
  'IN': ['219', '260', '317', '574', '765', '812'],
  'IA': ['319', '515', '563', '641', '712'],
  'KS': ['316', '620', '785', '913'],
  'KY': ['270', '502', '606', '859'],
  'LA': ['225', '318', '337', '504', '985'],
  'ME': ['207'],
  'MD': ['240', '301', '410', '443', '667'],
  'MA': ['339', '351', '413', '508', '617', '774', '781', '857', '978'],
  'MI': ['231', '248', '269', '313', '517', '586', '616', '734', '810', '906', '947', '989'],
  'MN': ['218', '320', '507', '612', '651', '763', '952'],
  'MS': ['228', '601', '662', '769'],
  'MO': ['314', '417', '573', '636', '660', '816'],
  'MT': ['406'],
  'NE': ['308', '402', '531'],
  'NV': ['702', '725', '775'],
  'NH': ['603'],
  'NJ': ['201', '551', '609', '732', '848', '856', '862', '908', '973'],
  'NM': ['505', '575'],
  'NY': ['212', '315', '347', '516', '518', '585', '607', '631', '646', '716', '718', '845', '914', '917', '929'],
  'NC': ['252', '336', '704', '743', '828', '910', '919', '980', '984'],
  'ND': ['701'],
  'OH': ['216', '220', '234', '330', '380', '419', '440', '513', '567', '614', '740', '937'],
  'OK': ['405', '539', '580', '918'],
  'OR': ['458', '503', '541', '971'],
  'PA': ['215', '267', '272', '412', '484', '570', '610', '717', '724', '814', '878'],
  'RI': ['401'],
  'SC': ['803', '843', '854', '864'],
  'SD': ['605'],
  'TN': ['423', '615', '731', '865', '901', '931'],
  'TX': ['210', '214', '254', '281', '325', '346', '361', '409', '430', '432', '469', '512', '682', '713', '726', '737', '806', '817', '830', '832', '903', '915', '936', '940', '956', '972', '979'],
  'UT': ['385', '435', '801'],
  'VT': ['802'],
  'VA': ['276', '434', '540', '571', '703', '757', '804'],
  'WA': ['206', '253', '360', '425', '509', '564'],
  'WV': ['304', '681'],
  'WI': ['262', '414', '534', '608', '715', '920'],
  'WY': ['307'],
  'DC': ['202'],
};

function generateRandomDigits(count: number): string {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

function generatePhoneNumber(state: string | null): string {
  // Get area codes for the state, or use a default
  const areaCodes = stateAreaCodes[state?.toUpperCase() || 'CA'] || ['555'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  
  // Generate 7 random digits
  const remaining = generateRandomDigits(7);
  
  // Format: XXX-XXX-XXXX
  return `${areaCode}-${remaining.substring(0, 3)}-${remaining.substring(3)}`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting affiliate phone number update...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all affiliates with empty phone numbers
    const { data: affiliates, error: fetchError } = await supabase
      .from('affiliates')
      .select('id, state_province, phone')
      .or('phone.is.null,phone.eq.');

    if (fetchError) {
      console.error('Error fetching affiliates:', fetchError);
      throw fetchError;
    }

    if (!affiliates || affiliates.length === 0) {
      console.log('No affiliates with empty phone numbers found');
      return new Response(
        JSON.stringify({ message: 'No affiliates to update', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${affiliates.length} affiliates with empty phone numbers`);

    // Update each affiliate with a generated phone number
    let successCount = 0;
    let errorCount = 0;

    for (const affiliate of affiliates) {
      const phoneNumber = generatePhoneNumber(affiliate.state_province);
      
      const { error: updateError } = await supabase
        .from('affiliates')
        .update({ phone: phoneNumber })
        .eq('id', affiliate.id);

      if (updateError) {
        console.error(`Error updating affiliate ${affiliate.id}:`, updateError);
        errorCount++;
      } else {
        console.log(`Updated affiliate ${affiliate.id} with phone: ${phoneNumber}`);
        successCount++;
      }
    }

    console.log(`Update complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        message: 'Phone numbers updated',
        totalProcessed: affiliates.length,
        successCount,
        errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in update-affiliate-phones function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
