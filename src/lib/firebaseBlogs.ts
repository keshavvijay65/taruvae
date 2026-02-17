import { ref, set, get, onValue, off, DataSnapshot } from 'firebase/database';
import { getFirebaseDatabase } from './firebase';

// SSR-SAFE: Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// SSR-SAFE localStorage helpers
function getLocalStorage(key: string): string | null {
    if (!isBrowser) return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function setLocalStorage(key: string, value: string): void {
    if (!isBrowser) return;
    try {
        localStorage.setItem(key, value);
    } catch {
        // Silently fail
    }
}

// Helper function to remove undefined values from objects (Firebase doesn't allow undefined)
function removeUndefinedValues(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefinedValues(item));
    } else if (obj !== null && typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
                cleaned[key] = removeUndefinedValues(obj[key]);
            }
        }
        return cleaned;
    }
    return obj;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    category: string;
    image?: string;
    publishedAt: number;
    updatedAt?: number;
    published: boolean;
    tags?: string[];
    views?: number;
}

// Default blog posts
export function getDefaultBlogPosts(): BlogPost[] {
    return [
        {
            id: 'blog_1',
            title: 'Why Grandma Was Right About Desi Ghee (And Science Agrees)',
            slug: 'why-grandma-was-right-about-desi-ghee',
            excerpt: 'Forget the fat-phobia. Desi Ghee is the superfood your body has been craving. Here’s the science behind the golden magic.',
            content: `
                <h2>Let's Be Real: Butter is Good, but Ghee is Gold.</h2>
                <p>Remember when everyone said fats were bad? For decades, we were told that fats were the enemy, leading to a surge in "low-fat" products that were actually loaded with sugar. Fortunately, we're over that now. But even in the health world, one star shines brighter than the rest: <strong>A2 Desi Cow Ghee</strong>.</p>
                
                <p>It’s not just a cooking ingredient; it’s liquid gold. And guess what? Your grandmother shouting at you to finish the ghee on your roti wasn't just love—it was wisdom passed down through generations. Today, modern science is finally catching up to what Ayurveda has known for five thousand years.</p>

                <h3>The "Bilona" Magic: Why Process Matters</h3>
                <p>Most ghee you find in supermarkets is made using "Direct Cream" processing. Machines spin milk at high speeds to separate cream, which is then boiled. It's fast, cheap, and... well, inferior.</p>
                <p>Our ghee is made using the ancient <strong>Bilona method</strong>. Here’s how the magic happens:</p>
                <ul>
                    <li><strong>Pure A2 Milk:</strong> We start with milk from grass-fed Desi cows.</li>
                    <li><strong>The Curd Step:</strong> The milk is boiled and then turned into curd using natural cultures.</li>
                    <li><strong>Hand-Churning (Bilona):</strong> That curd is then churned using a wooden churner (a Bilona) to separate the butter (makhhan). This process preserves the living enzymes.</li>
                    <li><strong>Slow Wood-Fire:</strong> The butter is slowly heated on a traditional chulha (wood fire) until the water evaporates and the golden solids remain.</li>
                </ul>
                <p>The result? A nutty, aromatic, golden elixir that tastes like heaven and heals like medicine.</p>

                <h3>Deep Dive: Why Your Body Needs Ghee</h3>
                <ul>
                    <li><strong>Gut Health Hero (Butyric Acid):</strong> Ghee is one of the richest sources of butyrate, a short-chain fatty acid that feeds the cells of your gut lining. If you struggle with bloating or a "leaky gut," ghee is your best friend. It reduces inflammation in the digestive tract and helps you absorb nutrients better.</li>
                    <li><strong>Vitamin K2: The Bone & Heart Protector:</strong> Unlike butter from grain-fed cows, A2 Ghee from grass-fed cows is rich in Vitamin K2. This rare vitamin ensures that calcium goes to your bones and teeth, and NOT to your arteries where it can cause blockages.</li>
                    <li><strong>Brain Food:</strong> Your brain is about 60% fat. Ancient texts call Ghee a "Medhya" food—something that enhances memory, intellect, and cognitive function. The healthy fats in Ghee cross the blood-brain barrier to provide sustained energy.</li>
                    <li><strong>Stable Cooking:</strong> Ghee has a very high smoke point (250°C/482°F). Unlike olive oil or refined oils, it doesn't break down into toxic free radicals when you cook your daily tadka.</li>
                </ul>
                
                <p><strong>The Final Spoonful:</strong> Start small. Just one teaspoon of pure A2 Ghee on your warm dal or roti can change your digestion and energy levels. Stop treating it as a "fat" and start treating it as a "fuel." Your body will thank you.</p>
            `,
            author: 'Taruvae Team',
            category: 'Traditional Wisdom',
            publishedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['ghee', 'superfood', 'ayurveda', 'gut health'],
            views: 450,
            image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_2',
            title: 'Stop Cooking with "Dead" Oil: The Cold-Pressed Revolution',
            slug: 'stop-cooking-with-dead-oil',
            excerpt: 'Most refined oils are chemically treated and stripped of nutrients. It’s time to switch to oils that are actually alive.',
            content: `
                <h2>The Ugly Truth About Refined Oils</h2>
                <p>Take a look at that clear, odorless bottle of refined vegetable oil in your kitchen. It looks "pure," doesn't it? The truth is far messier. To make refined oil, seeds are subjected to an industrial nightmare.</p>

                <h3>The 4 Stages of Refining:</h3>
                <ol>
                    <li><strong>Extraction with Hexane:</strong> Instead of pressing the seeds, factories use chemical solvents like Hexane (a component of gasoline) to squeeze out every last drop of oil.</li>
                    <li><strong>Neutralization:</strong> The oil is mixed with caustic soda (sodium hydroxide) to remove "impurities" (which are actually nutrients).</li>
                    <li><strong>Bleaching:</strong> The oil is filtered through "bleaching earth" to remove its natural color.</li>
                    <li><strong>Deodorizing:</strong> Finally, it's heated to temperatures as high as 230°C to strip away its natural smell.</li>
                </ol>
                <p>What's left? A "dead" oil that is high in calories but zero in nutrition, often containing trans fats and toxic residues. It's essentially liquid plastic for your heart.</p>

                <h3>The Cold-Pressed Alternative (Wood Pressed / Kachhi Ghani)</h3>
                <p>Now, imagine a different way. A large wooden pestle slowly rotates, crushing seeds at room temperature. No external heat is applied. No chemicals are added. The oil that flows out is thick, fragrant, and vibrant. This is <strong>Cold-Pressed Oil</strong>.</p>
                
                <p>Because the temperature never rises above 45°C, the delicate antioxidants and vitamins remain perfectly intact. It’s "living" oil.</p>

                <h3>Why Your Kitchen Needs a Change:</h3>
                <ul>
                    <li><strong>Antioxidant Powerhouse:</strong> Cold-pressed oils (like our Wood-Pressed Groundnut Oil) are loaded with Vitamin E and phytosterols that fight oxidative stress in your body.</li>
                    <li><strong>The Flavor Difference:</strong> Have you ever smelled real mustard oil? It’s pungent and sinus-clearing. Have you smelled real coconut oil? It’s like a tropical breeze. Refined oils have no soul; cold-pressed oils have a story.</li>
                    <li><strong>Better Heart Health:</strong> Cold-pressed oils retain the natural ratios of Omega-3 to Omega-6 fatty acids, supporting healthy cholesterol levels instead of clogging your pipes.</li>
                </ul>

                <h3>A Quick Smoke Point Guide:</h3>
                <table>
                  <tr><th>Oil Type</th><th>Smoke Point</th><th>Best Used For</th></tr>
                  <tr><td>Mustard Oil</td><td>250°C</td><td>Deep frying, Tadkas</td></tr>
                  <tr><td>Groundnut Oil</td><td>227°C</td><td>Stir frying, Sautéing</td></tr>
                  <tr><td>Coconut Oil</td><td>177°C</td><td>Baking, Low-heat cooking</td></tr>
                </table>

                <p><strong>The Choice is Yours:</strong> Your heart is the engine of your body. Would you fuel a luxury car with cheap, adulterated petrol? Of course not. Don’t do that to yourself either. Make the switch today.</p>
            `,
            author: 'Wellness Expert',
            category: 'Health & Nutrition',
            publishedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['cold pressed', 'health', 'cooking', 'detox'],
            views: 520,
            image: "https://images.unsplash.com/photo-1474979266404-7cadd9419f90?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_3',
            title: 'The Secret to Glowing Skin? It’s Not a Cream.',
            slug: 'secret-to-glowing-skin',
            excerpt: 'You spend thousands on serums, but the real secret to radiance might just be sitting in your kitchen pantry.',
            content: `
                <h2>Outer Beauty is an Inner Job.</h2>
                <p>We’ve all been there—standing in the pharmacy aisle, squinting at the ingredients on a $50 bottle of "Revitalizing Glow Serum." We apply it, we wait, and... nothing. That’s because your skin is a mirror of what’s happening inside your gut and your bloodstream.</p>

                <h3>Ayurveda’s "Glow" Philosophy</h3>
                <p>In Ayurveda, beautiful skin (Prabha) is a result of balanced "Agni" (digestive fire) and "Rakta" (healthy blood). If your digestion is slow, toxins (Ama) build up and show up as acne, dullness, or dark circles. No cream can fix that. But these three ancient rituals can.</p>

                <h3>1. Nasya: The Brain & Beauty Hack</h3>
                <p>It sounds strange to put fat in your nose, but it’s a game-changer. Nasya involves putting two drops of warm <strong>A2 Desi Ghee</strong> in each nostril at bedtime. This nourishes the "Shringataka Marma"—a vital point in your head. It helps you sleep better (which fixes "bags" under eyes) and gives your face a natural, lit-from-within radiance.</p>

                <h3>2. Oil Pulling (Gandusha): The Morning Detox</h3>
                <p>Take one tablespoon of <strong>Cold-Pressed Coconut Oil</strong> first thing in the morning. Swish it around your mouth for 5-10 minutes. Don't swallow it! The oil acts like a magnet, pulling out toxins and bacteria from your oral cavity. Not only does it whiten teeth, but it also clears up your lymphatic system, meaning fewer breakouts on your chin and jawline.</p>

                <h3>3. The Real Golden Latte (Haldi Doodh)</h3>
                <p>Skip the sugary café versions. Make the real deal at home:</p>
                <ul>
                    <li>1 Cup of Warm A2 Milk (or Coconut Milk)</li>
                    <li>1/2 tsp <strong>Lakadong Turmeric</strong> (High Curcumin)</li>
                    <li>A pinch of <strong>Black Pepper</strong> (Crucial for Turmeric absorption)</li>
                    <li>A small spoonful of <strong>A2 Ghee</strong></li>
                </ul>
                <p>Curcumin is fat-soluble. The Ghee and pepper ensure your body actually absorbs the anti-inflammatory goodness. This drink cleanses your liver, and a clean liver equals clear skin.</p>

                <p><strong>The Takeaway:</strong> Stop covering up and start healing. Feed your skin from the inside out. <strong>Eat clean, glow natural.</strong></p>
            `,
            author: 'Taruvae Team',
            category: 'Beauty & Lifestyle',
            publishedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['skincare', 'natural beauty', 'ayurveda', 'glow'],
            views: 680,
            image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_4',
            title: 'Mustard Oil: The "Bad Boy" of Indian Kitchens',
            slug: 'mustard-oil-benefits',
            excerpt: 'Pungent, bold, and unapologetically strong. Here is why pure Kacchi Ghani Mustard Oil is the king of North Indian cooking.',
            content: `
                <h2>It Stings. It Smells. We Love It.</h2>
                <p>If you've ever walked into a kitchen in North India or Bengal while mustard oil is heating up, you know the feeling. Your eyes might water, your nose might tingle. That is the smell of <strong>potency</strong>. In the West, they used to label it "For External Use Only," but we’ve known its secrets for centuries.</p>

                <h3>Why it Reigns Supreme in Your Kadai</h3>
                <p>Pure Kacchi Ghani Mustard Oil is legendary not just for its zing, but for its chemistry. It has an ideal ratio of Omega-3 and Omega-6 fatty acids and is very high in Monounsaturated Fatty Acids (MUFA), which are incredible for heart health.</p>

                <h3>The Pickling King</h3>
                <p>Have you wondered why your grandmother's mango pickle never goes bad, even after two years? It’s because Mustard Oil is a natural antibiotic. When you submerge vegetables in it, it prevents the growth of bacteria and fungus. It doesn't just preserve the food; it adds a kick that refined oils can never touch.</p>

                <h3>Beyond the Kitchen: The Winter Healer</h3>
                <ul>
                    <li><strong>Join Pain Relief:</strong> Warm up some mustard oil with a few cloves of garlic. Massage it onto your joints. The heating properties of the oil stimulate blood circulation and provide instant relief from stiffness.</li>
                    <li><strong>Hair Health:</strong> It is a natural "pre-shower" mask. Massaging it into the scalp helps fight dandruff and promotes hair growth by stimulating hair follicles.</li>
                    <li><strong>Sinus Relief:</strong> Inhaling the pungency of heating mustard oil can actually help clear a blocked nose.</li>
                </ul>

                <p><strong>Embrace the Zing:</strong> Don't fear the strong aroma. When you heat mustard oil to its smoking point, that pungency mellows into a deep, nutty richness that makes vegetables, fish, and curries taste alive. Upgrade your cooking with <strong>Taruvae Kacchi Ghani</strong>.</p>
            `,
            author: 'Chef Taruvae',
            category: 'Food Culture',
            publishedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['mustard oil', 'indian cooking', 'tradition', 'health'],
            views: 320,
            image: "https://images.unsplash.com/photo-1589927986089-394e273ef433?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_5',
            title: '5 Morning Rituals That Will Actually Change Your Life',
            slug: 'morning-rituals-change-life',
            excerpt: 'No waking up at 4 AM required. Just simple, practical habits to start your day with energy and purpose.',
            content: `
                <h2>Win the Morning, Win the Day.</h2>
                <p>You don't need to be a productivity guru or a monk to have a successful morning. Large, overwhelming routines usually fail. What works are tiny, consistent rituals that wire your brain and body for success. Here are five habits that take less than 15 minutes but change everything.</p>

                <h3>1. The Hydration Threshold</h3>
                <p>Before you touch your phone, before you reach for coffee—drink a large glass of warm water. Your body has been dehydrating for 7-8 hours. A simple squeeze of lemon or a pinch of <strong>Himalayan Pink Salt</strong> can add necessary electrolytes to wake up your cells and get your digestion moving.</p>

                <h3>2. The "Fat" Coffee/Tea Concept</h3>
                <p>If you're a caffeine lover, try this: add one teaspoon of <strong>A2 Ghee</strong> or <strong>Cold-Pressed Coconut Oil</strong> to your cup. Known as "Bulletproof" style, these healthy fats slow down the absorption of caffeine. This means you get a steady stream of energy for 4 hours instead of a massive high followed by a "jittery" crash at noon.</p>

                <h3>3. Five Minutes of Micro-Movement</h3>
                <p>You don't need a 60-minute gym session at dawn. Stand up, stretch your arms, do ten air-squats, or simply walk around your balcony. This signals to your brain that "sleep mode" is over and "active mode" has begun. It flushes out the cortisol that builds up while you sleep.</p>

                <h3>4. The High-Protein, Good-Fat Breakfast</h3>
                <p>Stop eating sugary cereals or simple white bread. They spike your insulin and make you sleepy by 11 AM. Instead, have a paratha with <strong>White Butter</strong>, some eggs, or a smoothie with nuts. Good fats keep you satiated and your brain sharp.</p>

                <h3>5. The Gratitude Grounding</h3>
                <p>Before stepping into the chaos of work, think of exactly one thing you’re thankful for. It could be as simple as the smell of your morning tea. This small act rewires your brain’s Reticular Activating System (RAS) to look for the "good" throughout the rest of your day.</p>
                
                <p><strong>Consistency > Complexity:</strong> Start with just one of these tomorrow. Then add another next week. Small changes have a massive cumulative impact. Let's start tomorrow.</p>
            `,
            author: 'Life Coach',
            category: 'Wellness',
            publishedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['productivity', 'morning routine', 'wellness', 'habits'],
            views: 940,
            image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_6',
            title: 'Is Your "Honey" Actually Just Sugar Syrup?',
            slug: 'is-honey-just-sugar-syrup',
            excerpt: 'The sticky truth about commercial honey vs. raw wild honey. One is medicine, the other is just flavored glucose.',
            content: `
                <h2>Not All Honey is Created Equal.</h2>
                <p>Most people think honey is just honey. But if you walk down a supermarket aisle and see rows of perfectly clear, golden, squeeze-bottles of honey that haven’t crystallized in months—beware. You might be buying flavored rice syrup or high-fructose corn syrup.</p>

                <h3>The Adulteration Scandal</h3>
                <p>In recent years, many major honey brands have been found to contain added sugar syrups that bypass basic laboratory tests. To make honey cheap, factories "pasteurize" it at high temperatures. This prevents crystallization but it also kills every single beneficial enzyme and nutrient. It turns a "medicine" into "sugar."</p>

                <h3>Wild Honey vs. Farm Honey</h3>
                <p>At Taruvae, our honey comes from <strong>deep forests</strong>, not boxes on a farm. Here is what makes "Wild" honey superior:</p>
                <ul>
                    <li><strong>Polyfloral Power:</strong> Farm bees visit one type of crop. Wild bees visit thousands of different medicinal flowers. The nutrient profile is incredible.</li>
                    <li><strong>Raw & Unprocessed:</strong> We simply strain the honey to remove wax and bee parts. We NEVER heat it. This preserves the the natural enzymes that help your digestion.</li>
                    <li><strong>Bee Pollen Content:</strong> Raw wild honey is naturally cloudy. That cloudiness is actually suspended bee pollen—a potent natural antioxidant and protein source.</li>
                </ul>

                <h3>The "Home Test" for Purity:</h3>
                <p>Take a glass of water and drop a spoonful of honey into it. Pure wild honey will sink to the bottom as a solid lump and won't dissolve immediately. Adulterated honey will start dissolving and swirling in the water the moment it touches the surface.</p>

                <p><strong>The Final Word:</strong> If your honey is "too perfect," it probably isn't honey. Embrace the crystals, embrace the cloudy look, and <strong>taste the real forest</strong>.</p>
            `,
            author: 'Taruvae Team',
            category: 'Food Truths',
            publishedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['honey', 'wild honey', 'sugar free', 'natural'],
            views: 815,
            image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_7',
            title: 'Coconut Oil: The Multitasking Miracle You Need',
            slug: 'coconut-oil-multitasking-miracle',
            excerpt: 'From frying pans to hair masks, Cold-Pressed Coconut Oil is the MVP of your home. Here is why you need a jar in every room.',
            content: `
                <h2>The White Gold of Nature</h2>
                <p>If you were stranded on a desert island and could only take one natural product with you, it should be a jar of <strong>Cold-Pressed Extra Virgin Coconut Oil</strong>. It is perhaps the most versatile substance on the planet, serving your kitchen, your bathroom, and your first-aid kit all at once.</p>

                <h3>The Science of MCTs</h3>
                <p>Coconut oil is 90% saturated fat, but don't let that scare you. It’s primarily made of <strong>MCTs (Medium Chain Triglycerides)</strong>, specifically Lauric Acid. Unlike long-chain fats in meat, MCTs go straight from your gut to your liver. Your body uses them for <em>immediate energy</em> rather than storing them as fat. This makes it a favorite for athletes and those on a Keto diet.</p>

                <h3>In the Kitchen: High-Heat Champion</h3>
                <p>Because it's a stable saturated fat, coconut oil is exceptional for cooking. It doesn't oxidize or turn rancid even at high temperatures. It adds a subtle, tropical sweetness to stir-fries, and is the secret to the best popcorn you’ll ever have.</p>

                <h3>The Beauty Secret: Ditch the Chemicals</h3>
                <ul>
                    <li><strong>The Ultimate Hair Mask:</strong> Small molecules of coconut oil can actually penetrate the hair shaft, reducing protein loss. Apply it warm, leave it for 30 minutes, and say goodbye to frizz.</li>
                    <li><strong>Natural Makeup Remover:</strong> Even the most stubborn waterproof mascara melts away instantly when touched with a dab of coconut oil. It’s gentler and safer than chemical wipes.</li>
                    <li><strong>Skin Barrier Support:</strong> It is a natural antifungal and antibacterial. Use it on dry elbows, cracked heels, or even as a gentle lip balm.</li>
                </ul>

                <p><strong>Pro Tip:</strong> Only use <strong>Cold-Pressed</strong>. Refined coconut oil is often bleached and has no scent. You want the one that smells like a fresh coconut—that’s where the power lies. <strong>Get your jar of Taruvae Coconut Oil today.</strong></p>
            `,
            author: 'Wellness Expert',
            category: 'Lifestyle',
            publishedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['coconut oil', 'beauty', 'cooking', 'keto'],
            views: 742,
            image: "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_8',
            title: 'Why We Are Obsessed With Lakadong Turmeric',
            slug: 'lakadong-turmeric-obsession',
            excerpt: 'Not all haldi is the same. Meet the world’s most potent turmeric from the hills of Meghalaya.',
            content: `
                <h2>The Golden Standard of Spices</h2>
                <p>In every Indian household, turmeric (Haldi) is the first line of defense against wounds, colds, and infections. But here is the secret: most turmeric powder sold globally is a shadow of what it should be. It’s often grown with heavy pesticides and has a "Curcumin" content of barely 2-3%. To get real healing, you need <strong>Lakadong</strong>.</p>

                <h3>What is Lakadong?</h3>
                <p>Grown exclusively in the tiny village of Lakadong in the Jaintia Hills of Meghalaya, this variety of turmeric is considered the best in the world. The soil in this region is unique, and the traditional organic farming methods used by the local tribes are legendary.</p>

                <h3>The Curcumin Difference</h3>
                <p>Curcumin is the active compound that makes turmeric a "superfood." It's what fights inflammation and boosts immunity. While standard turmeric has 2% curcumin, pure <strong>Lakadong Turmeric has 7% to 12% Curcumin</strong>. That’s nearly 5 times the potency!</p>

                <h3>How to Spot the Real Deal:</h3>
                <ul>
                    <li><strong>Vibrant Color:</strong> It’s a deep, rich brownish-orange. If your turmeric is pale yellow, it’s low quality.</li>
                    <li><strong>Intense Aroma:</strong> Real Lakadong has a sharp, earthy, and almost ginger-like smell.</li>
                    <li><strong>A Little Goes a Long Way:</strong> Because it’s so potent, you only need half a teaspoon to get the color and health benefits of a full tablespoon of regular haldi.</li>
                </ul>

                <h3>The Absorption Rule:</h3>
                <p>Your body is bad at absorbing Curcumin alone. You MUST pair your Lakadong Turmeric with <strong>Piperine</strong> (found in Black Pepper) and a <strong>Healthy Fat</strong> (like Ghee or Coconut Oil). This increases absorption by nearly 2000%.</p>

                <p><strong>Invest in Your Health:</strong> Don't settle for dusty, pale powders. Upgrade your spice cabinet with <strong>Taruvae Lakadong Turmeric</strong>—direct from the hills of Meghalaya.</p>
            `,
            author: 'Spice Hunter',
            category: 'Superfoods',
            publishedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['turmeric', 'spices', 'immunity', 'inflammation'],
            views: 480,
            image: "https://images.unsplash.com/photo-1615485500704-8e99099d9d2f?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_9',
            title: 'The Great Salt Switch: Why Table Salt is Trash',
            slug: 'table-salt-vs-pink-salt',
            excerpt: 'Bleached, flowing, and stripped of minerals. Why your specialized iodized salt might be doing more harm than good.',
            content: `
                <h2>Is Your Salt a Dead Mineral?</h2>
                <p>Salt is the most essential mineral in the human diet. It regulates our blood pressure, nerve function, and hydration. But the white, free-flowing table salt in most kitchens is a product of chemical engineering, not nature.</p>

                <h3>Table Salt: The Industrial Process</h3>
                <p>Modern table salt is processed at 1200°F, which changes its molecular structure. It is stripped of all natural minerals except Sodium and Chloride. To keep it "free-flowing," manufacturers add anti-caking agents like ferrocyanide or aluminum silicate. Then, it's bleached to give it that sparkling white color. You are literally eating bleached chemicals.</p>

                <h3>The Pink & Black Alternative</h3>
                <p><strong>Himalayan Pink Salt</strong> and <strong>Indian Black Salt (Kala Namak)</strong> are mined from ancient sea beds that have been protected by volcanic rock for millions of years. No chemicals. No bleach.</p>
                <ul>
                    <li><strong>84 Trace Minerals:</strong> While table salt is just 2 elements, Pink Salt contains 84 different minerals including Magnesium, Calcium, and Potassium. These minerals help your body process the sodium more effectively, preventing high blood pressure.</li>
                    <li><strong>Natural PH Balance:</strong> These salts are alkaline, helping to reduce acidity in your body.</li>
                    <li><strong>Electrolyte Support:</strong> It's the best thing for a post-workout drink. A pinch of pink salt in water hydrates you better than any "sports drink."</li>
                </ul>

                <h3>Kala Namak: The Gut Healer</h3>
                <p>Black salt is famous in Ayurveda for aiding digestion. It’s naturally high in sulfur, which helps break down heavy foods. That’s why it’s a staple in Indian street food like Chaat—it prevents the bloating that usually follows a heavy meal.</p>

                <p><strong>Simple Swap:</strong> It’s the easiest health change you can make. Empty your white salt shaker and fill it with <strong>Taruvae Himalayan Pink Salt</strong>. Your heart and your tastebuds will notice the difference.</p>
            `,
            author: 'Taruvae Team',
            category: 'Health Truths',
            publishedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['salt', 'nutrition', 'detox', 'health'],
            views: 530,
            image: "https://images.unsplash.com/photo-1627532675865-06b23a9d7010?q=80&w=1000&auto=format&fit=crop"
        },
        {
            id: 'blog_10',
            title: 'A2 Milk: The Dairy Comeback Story',
            slug: 'a2-milk-dairy-comeback',
            excerpt: 'Lactose intolerant? Or just drinking the wrong milk? The answer might surprise you.',
            content: `
                <h2>The Mystery of Dairy Sensitivity</h2>
                <p>In the last decade, millions of people have stopped drinking milk, citing bloating, gas, and discomfort. Most assume they are "Lactose Intolerant." But here is the twist: modern science suggests many of these people are actually sensitive to a specific protein called <strong>A1 Beta-Casein</strong>, not the lactose (milk sugar).</p>

                <h3>A1 vs. A2: A Genetic Mutation</h3>
                <p>Originally, all cows produced A2 beta-casein protein. About 8,000 years ago, a genetic mutation occurred in European cattle breeds, leading to the production of A1 protein. When we digest A1 milk, it breaks down into a peptide called BCM-7, which causes inflammation and digestive distress. <strong>A2 milk does not produce this peptide.</strong></p>

                <h3>The Desi Cow (Bos Indicus)</h3>
                <p>Our indigenous Indian breeds—the Gir, Sahiwal, and Rathi—have never undergone this mutation. They naturally produce <strong>100% A2 Milk</strong>. It is molecularly closer to human breast milk than the milk from imported Jersey or Holstein cows.</p>

                <h3>Why A2 Matters for You:</h3>
                <ul>
                    <li><strong>Easier Digestion:</strong> Most people who experience bloating with regular milk find they have zero issues with A2 milk.</li>
                    <li><strong>Gut Health:</strong> A2 protein doesn't cause the "leaky gut" inflammation associated with A1 milk.</li>
                    <li><strong>Better for Kids:</strong> BCM-7 has been linked to various cognitive and behavioral issues in growing children. Switching to A2 is a safer, more natural choice for their development.</li>
                </ul>
                
                <p>This is why we are so obsessed with our Ghee. It starts with the right milk. When you start with 100% A2 Desi Cow milk, you get a product that isn't just a fat—it's a holistic health supplement.</p>

                <p><strong>Join the Dairy Renaissance:</strong> Stop fearing milk. Start choosing the right kind. <strong>Experience the Taruvae A2 difference.</strong></p>
            `,
            author: 'Taruvae Team',
            category: 'Traditional Wisdom',
            publishedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
            published: true,
            tags: ['milk', 'A2', 'dairy', 'gut health'],
            views: 920,
            image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=1000&auto=format&fit=crop"
        }
    ];
}

// Save blog posts to Firebase
export async function saveBlogPostsToFirebase(posts: BlogPost[]): Promise<{ success: boolean; message: string }> {
    try {
        const db = getFirebaseDatabase();
        if (!db) {
            setLocalStorage('taruvae-blog-posts', JSON.stringify(posts));
            if (isBrowser) {
                window.dispatchEvent(new Event('taruvae-blogs-updated'));
            }
            return { success: true, message: 'Blog posts saved to localStorage (Firebase not configured)' };
        }

        const cleanedPosts = removeUndefinedValues(posts);
        const blogsRef = ref(db, 'blogs');
        await set(blogsRef, cleanedPosts);

        setLocalStorage('taruvae-blog-posts', JSON.stringify(posts));
        if (isBrowser) {
            window.dispatchEvent(new Event('taruvae-blogs-updated'));
        }

        return { success: true, message: 'Blog posts saved to Firebase successfully' };
    } catch (error: any) {
        console.error('Error saving blog posts to Firebase:', error);
        setLocalStorage('taruvae-blog-posts', JSON.stringify(posts));
        if (isBrowser) {
            window.dispatchEvent(new Event('taruvae-blogs-updated'));
        }
        return { success: false, message: error.message || 'Failed to save blog posts to Firebase' };
    }
}

// Get all blog posts from Firebase
export async function getAllBlogPostsFromFirebase(): Promise<BlogPost[]> {
    try {
        const db = getFirebaseDatabase();
        if (!db) {
            const savedPosts = getLocalStorage('taruvae-blog-posts');
            if (savedPosts) {
                return JSON.parse(savedPosts);
            }
            return [];
        }

        const blogsRef = ref(db, 'blogs');
        let snapshot: DataSnapshot;
        try {
            snapshot = await get(blogsRef);
        } catch (error) {
            // If Firebase fails, fallback to localStorage
            console.warn('Firebase get failed, using localStorage:', error);
            const savedPosts = getLocalStorage('taruvae-blog-posts');
            if (savedPosts) {
                return JSON.parse(savedPosts);
            }
            return [];
        }

        if (snapshot.exists()) {
            const blogsData = snapshot.val();
            if (Array.isArray(blogsData)) {
                return blogsData;
            }
            return Object.values(blogsData);
        }

        const savedPosts = getLocalStorage('taruvae-blog-posts');
        if (savedPosts) {
            return JSON.parse(savedPosts);
        }
        return [];
    } catch (error: any) {
        console.error('Error fetching blog posts from Firebase:', error);
        const savedPosts = getLocalStorage('taruvae-blog-posts');
        if (savedPosts) {
            return JSON.parse(savedPosts);
        }
        return [];
    }
}

// Get published blog posts only
export async function getPublishedBlogPostsFromFirebase(): Promise<BlogPost[]> {
    try {
        const allPosts = await getAllBlogPostsFromFirebase();
        return allPosts.filter(post => post.published).sort((a, b) => b.publishedAt - a.publishedAt);
    } catch (error: any) {
        console.error('Error fetching published blog posts:', error);
        return [];
    }
}

// Get a single blog post by slug
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        const allPosts = await getAllBlogPostsFromFirebase();
        return allPosts.find(post => post.slug === slug && post.published) || null;
    } catch (error: any) {
        console.error('Error fetching blog post by slug:', error);
        return null;
    }
}

// Listen to blog posts in real-time
export function subscribeToBlogPosts(callback: (posts: BlogPost[]) => void): () => void {
    if (!isBrowser) {
        callback([]);
        return () => { };
    }
    try {
        const db = getFirebaseDatabase();
        if (!db) {
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'taruvae-blog-posts') {
                    try {
                        const posts = e.newValue ? JSON.parse(e.newValue) : [];
                        callback(posts);
                    } catch (error) {
                        console.error('Error parsing blog posts from storage event:', error);
                    }
                }
            };
            const handleCustomEvent = () => {
                try {
                    const savedPosts = getLocalStorage('taruvae-blog-posts');
                    const posts = savedPosts ? JSON.parse(savedPosts) : [];
                    callback(posts);
                } catch (error) {
                    console.error('Error parsing blog posts from custom event:', error);
                }
            };
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('taruvae-blogs-updated', handleCustomEvent);
            const savedPosts = getLocalStorage('taruvae-blog-posts');
            if (savedPosts) {
                try {
                    const posts = JSON.parse(savedPosts);
                    callback(posts);
                } catch (error) {
                    console.error('Error parsing initial blog posts:', error);
                }
            }
            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('taruvae-blogs-updated', handleCustomEvent);
            };
        }

        const blogsRef = ref(db, 'blogs');
        const handleSnapshot = (snapshot: DataSnapshot) => {
            if (snapshot.exists()) {
                const blogsData = snapshot.val();
                let posts: BlogPost[];
                if (Array.isArray(blogsData)) {
                    posts = blogsData;
                } else {
                    posts = Object.values(blogsData);
                }
                setLocalStorage('taruvae-blog-posts', JSON.stringify(posts));
                callback(posts);
            } else {
                const savedPosts = getLocalStorage('taruvae-blog-posts');
                if (savedPosts) {
                    try {
                        const posts = JSON.parse(savedPosts);
                        callback(posts);
                    } catch (error) {
                        console.error('Error parsing blog posts from localStorage:', error);
                        callback([]);
                    }
                } else {
                    callback([]);
                }
            }
        };
        // Set up listener with error handling for offline scenarios
        try {
            onValue(blogsRef, handleSnapshot, (error: Error | Event | unknown) => {
                const errorMessage = error instanceof Error
                    ? error.message
                    : error instanceof Event
                        ? `Event: ${error.type}`
                        : String(error);
                console.error('Firebase subscription error:', errorMessage, error);
                // Fallback to localStorage on subscription error
                const savedPosts = getLocalStorage('taruvae-blog-posts');
                if (savedPosts) {
                    try {
                        const posts = JSON.parse(savedPosts);
                        callback(posts);
                    } catch (parseError) {
                        console.error('Error parsing blog posts from localStorage:', parseError);
                        callback([]);
                    }
                } else {
                    callback([]);
                }
            });
        } catch (onValueError) {
            console.error('Error setting up onValue listener:', onValueError);
            // Fallback to localStorage
            const savedPosts = getLocalStorage('taruvae-blog-posts');
            if (savedPosts) {
                try {
                    const posts = JSON.parse(savedPosts);
                    callback(posts);
                } catch (parseError) {
                    callback([]);
                }
            } else {
                callback([]);
            }
        }

        return () => {
            try {
                off(blogsRef);
            } catch (offError) {
                // Ignore unsubscribe errors
            }
        };
    } catch (error: any) {
        console.error('Error setting up blog posts subscription:', error);
        return () => { };
    }
}

// Update blog post views count
export async function updateBlogPostViews(postId: string, newViewsCount: number): Promise<{ success: boolean; message: string }> {
    try {
        const db = getFirebaseDatabase();
        if (!db) {
            // Update in localStorage
            const savedPosts = getLocalStorage('taruvae-blog-posts');
            if (savedPosts) {
                const posts: BlogPost[] = JSON.parse(savedPosts);
                const postIndex = posts.findIndex(p => p.id === postId);
                if (postIndex !== -1) {
                    posts[postIndex].views = newViewsCount;
                    setLocalStorage('taruvae-blog-posts', JSON.stringify(posts));
                    if (isBrowser) {
                        window.dispatchEvent(new Event('taruvae-blogs-updated'));
                    }
                }
            }
            return { success: true, message: 'Views updated in localStorage' };
        }

        // Get all posts
        const blogsRef = ref(db, 'blogs');
        const snapshot = await get(blogsRef);

        if (snapshot.exists()) {
            const blogsData = snapshot.val();
            let posts: BlogPost[];

            if (Array.isArray(blogsData)) {
                posts = blogsData;
            } else {
                posts = Object.values(blogsData);
            }

            // Find and update the post
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                posts[postIndex].views = newViewsCount;

                // Save updated posts
                const cleanedPosts = removeUndefinedValues(posts);
                await set(blogsRef, cleanedPosts);

                // Also update localStorage
                setLocalStorage('taruvae-blog-posts', JSON.stringify(posts));
                if (isBrowser) {
                    window.dispatchEvent(new Event('taruvae-blogs-updated'));
                }

                return { success: true, message: 'Views updated successfully' };
            }
        }

        return { success: false, message: 'Post not found' };
    } catch (error: any) {
        console.error('Error updating blog post views:', error);
        return { success: false, message: error.message || 'Failed to update views' };
    }
}

