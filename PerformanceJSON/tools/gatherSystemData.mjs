// To be placed in the source code OF the facility site,
// this script gathers performance and structural data about the site.
// Then you may move the json to this repo for analysis.

// Make sure the repo debug console is set and not commented
// Run with: node gatherSystemData.mjs

// gatherSystemData.mjs
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import * as cheerio from 'cheerio';
import {performance} from 'perf_hooks';
import {fileURLToPath} from 'url';
import cliProgress from 'cli-progress';
import {execSync} from 'child_process';
import crypto from 'crypto';
import readlineSync from 'readline-sync';

// ========== 📦 ENV SETUP ==========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseURL = 'http://localhost:3000';
const outPath = path.resolve(__dirname, 'ARG_Performance_Results.json');
const cookiesList = [
    'accepted', 'Scroll_unlocked', 'Wifi_Unlocked', 'wifi_passed', 'No_corruption',
    'wifi_login', 'Media_Unlocked', 'Button_Unlocked', 'File_Unlocked',
    'corrupting', 'BnW_unlocked', 'Choice_Unlocked', 'terminal_unlocked',
    'End?', 'tree98_cutscene_seen', 'tree98_logged_in', 'moonlight_time_cutscene_played',
    'themoon', 'Interference_cutscene_seen', 'KILLTAS_cutscene_seen', 'TREE', 'THP_Play'
];

// ========== 📁 UTILITIES ==========

// Walk file tree
const walkFiles = (dir, exts = null) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).flatMap(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) return walkFiles(filePath, exts);
        if (!exts || exts.some(ext => file.endsWith(ext))) return {file: filePath, size: stat.size};
        return [];
    });
};

// Create and manage progress bars
const createBar = (label, color = chalk.cyan) => new cliProgress.SingleBar({
    format: `${label} |` + color('{bar}') + '| {percentage}% || {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});
const cookieBar = new cliProgress.SingleBar({
    format: 'Signing Cookies |' + chalk.cyan('{bar}') + '| {percentage}% || {value}/{total} cookies',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

// Discover routes from Next.js app router
const discoverRoutes = () => {
    const appPath = path.resolve(__dirname, 'app');
    const excludedRoutes = new Set([
        '/404', '/CHEATER', '/h0m3', '/api/auth', '/api/csrf-token', '/api/keyword',
        '/api/press', '/api/sign-cookie', '/api/state', '/api/wifi-panel'
    ]);
    const walk = (dir, current = '') => {
        return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) return walk(fullPath, `${current}/${entry.name}`);
            if (!entry.name.match(/^page\.([tj])sx?$/)) return [];
            let normalized = `${current}`.replace(/^\/?app/, '').replace(/\/index$/, '');
            if (!normalized.startsWith('/')) normalized = '/' + normalized;
            if (excludedRoutes.has(normalized)) return [];
            return [normalized];
        });
    };
    return [...new Set(walk(appPath))];
};

// Analyze text and DOM from HTML
const getTextAndDOMStats = html => {
    const $ = cheerio.load(html);
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return {wordCount: text.split(' ').length, domNodes: $('*').length};
};

// Evaluate localStorage size
const getLocalStorageUsageKB = async page => {
    return page.evaluate(() => {
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            total += key.length + (localStorage.getItem(key)?.length || 0);
        }
        return (total / 1024).toFixed(2);
    });
};

// Run Lighthouse audit
const runLighthouse = async (url, browser) => {
    const port = new URL(browser.wsEndpoint()).port;
    try {
        const {lhr} = await lighthouse(url, {
            port: parseInt(port, 10), output: 'json', logLevel: 'error'
        });
        const cat = lhr.categories;
        return {
            performance: cat.performance?.score,
            accessibility: cat.accessibility?.score,
            bestPractices: cat['best-practices']?.score,
            seo: cat.seo?.score,
            pwa: cat.pwa?.score
        };
    } catch (e) {
        console.error(chalk.red(`Lighthouse failed for ${url}: ${e.message}`));
        return null;
    }
};

// Dump file size data
const collectAssetData = (dir, label, color, relativeBase) => {
    const files = walkFiles(dir);
    const bar = createBar(label, color);
    bar.start(files.length, 0);

    const result = files.map((f, i) => {
        bar.update(i + 1);
        return {
            file: f.file.replace(relativeBase + path.sep, ''),
            size_kb: (f.size / 1024).toFixed(2)
        };
    });

    bar.stop();
    const totalMB = (files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2);
    return {total_size: `${totalMB} MB`, breakdown: result};
};

// Analyze codebase (components/hooks/lib)
const analyzeCodeFiles = async (dirName, key, report) => {
    const dir = path.resolve(__dirname, dirName);
    const files = walkFiles(dir, ['.js', '.jsx', '.ts', '.tsx', '.html']);
    const bar = createBar(key, chalk.cyan);
    bar.start(files.length, 0);

    report[key] = files.map((f, i) => {
        bar.update(i + 1);
        try {
            const content = fs.readFileSync(f.file, 'utf8');
            if (f.file.endsWith('.html')) {
                const $ = cheerio.load(content);
                return {
                    file: f.file.replace(dir + path.sep, ''),
                    text_words: $('body').text().split(/\s+/).length,
                    dom_nodes: $('*').length
                };
            } else {
                const clean = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/\s+/g, ' ').trim();
                const dom = (content.match(/<\w+/g) || []).length;
                return {
                    file: f.file.replace(dir + path.sep, ''),
                    text_words: clean.split(' ').length,
                    dom_nodes: dom
                };
            }
        } catch {
            return null;
        }
    }).filter(Boolean);

    bar.stop();
    console.log(chalk.green(`✅ ${key} analysis complete.`));
};

// Sign cookie locally (from API logic)
function signCookieLocally(data) {
    const SECRET = process.env.COOKIE_SECRET || 'Unsecure';

    if (!data || typeof data !== 'string' || !data.includes('=')) {
        return {success: false, error: 'Invalid data format'};
    }

    const [key, ...rest] = data.split('=');
    const value = rest.join('=');

    if (!key || !value) {
        return {success: false, error: 'Missing key or value'};
    }

    const signature = crypto.createHmac('sha256', SECRET).update(`${key}=${value}`).digest('hex');
    const cookieValue = `${value}.${signature}`;

    return {success: true, key, cookieValue};
}

// ========== 🚀 MAIN ==========
(async () => {
    // Set up script
    console.log(chalk.blue('🔎 Starting system data gathering...'));
    let report;

    try {
        report = await fs.readJson(outPath);
    } catch {
        report = {};
    }

    const routes = discoverRoutes();
    console.log(chalk.green(`✅ Discovered ${routes.length} routes.`));

    // Initialize Puppeteer as well as userAgent to skip middleware
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    // Sign cookies
    await page.goto(baseURL, {waitUntil: 'domcontentloaded'}); // anchor page load so cookies can be set
    for (const [i, name] of cookiesList.entries()) {
        try {
            const result = signCookieLocally(`${name}=true`);
            if (!result.success) {
                console.error(`Failed to sign cookie "${name}": ${result.error}`);
            } else {
                await page.setCookie({
                    name: result.key,
                    value: result.cookieValue,
                    url: baseURL
                });
            }
        } catch (err) {
            console.error(`Error signing cookie "${name}": ${err.message || err}`);
        }
        cookieBar.update(i + 1);
    }
    cookieBar.stop();
    console.log(chalk.blue(`🍪 Total cookies signed: ${cookiesList.length}, currently available successfully: ${(await page.cookies()).length}`));

    // Track route performance
    console.log(chalk.blue('🔍 Starting route analysis...'));
    let totalWords = 0, totalDOM = 0, totalLoadTime = 0;
    report.pages = [];
    const routeBar = createBar('Routes', chalk.yellow);
    routeBar.start(routes.length, 0);

    for (const [i, route] of routes.entries()) {
        const url = `${baseURL}${route}`;
        const routeUsedCookies = new Set();

        // Reset console listener for this route
        page.removeAllListeners('console');
        page.on('console', msg => {
            const text = msg.text();
            const match = text.match(/\[USED_COOKIE] (.+)/);
            if (match && match[1]) {
                routeUsedCookies.add(match[1].trim());
            }
        });

        try {
            const start = performance.now();
            const res = await page.goto(url, {waitUntil: 'networkidle2'});
            const duration = performance.now() - start;

            const html = await page.content();
            const {wordCount, domNodes} = getTextAndDOMStats(html);
            const localStorageKB = await getLocalStorageUsageKB(page);

            const lighthouseStats = await runLighthouse(url, browser);
            const memoryUsage = await page.evaluate(() => {
                try {
                    const perfMem = window?.performance?.memory;
                    const gxMemory = window?.gx?.memory;
                    if (perfMem) {
                        return {
                            jsHeapSizeLimit: perfMem.jsHeapSizeLimit,
                            totalJSHeapSize: perfMem.totalJSHeapSize,
                            usedJSHeapSize: perfMem.usedJSHeapSize
                        };
                    } else if (gxMemory) {
                        return {
                            jsHeapSizeLimit: gxMemory.jsHeapSizeLimit,
                            totalJSHeapSize: gxMemory.totalJSHeapSize,
                            usedJSHeapSize: gxMemory.usedJSHeapSize
                        };
                    }
                } catch (e) {
                    console.warn('Memory check failed:', e);
                }
                return null;
            });

            report.pages.push({
                route,
                status: res?.status || null,
                load_time_ms: Math.round(duration),
                text_words: wordCount,
                dom_nodes: domNodes,
                local_storage_kb: Number(localStorageKB),
                cookies: Array.from(routeUsedCookies),
                lighthouse: lighthouseStats,
                memory: memoryUsage
            });

            totalWords += wordCount;
            totalDOM += domNodes;
            totalLoadTime += duration;

        } catch (err) {
            console.error(chalk.red(`Failed on ${url}: ${err.message}`));
        }

        routeBar.update(i + 1);
    }

    routeBar.stop();
    report.global = {
        total_routes_tested: routes.length,
        average_load_time_ms: Math.round(totalLoadTime / routes.length),
        average_dom_nodes: Math.round(totalDOM / routes.length),
        average_text_words: Math.round(totalWords / routes.length)
    };

    // Asset scan
    const publicDir = path.resolve(__dirname, 'public');
    const publicAssets = collectAssetData(publicDir, 'Assets', chalk.green, publicDir);

    // Group assets by file extension
    const assetsByExtension = {};
    publicAssets.breakdown.forEach(asset => {
        const ext = path.extname(asset.file).toLowerCase() || 'no_ext';
        if (!assetsByExtension[ext]) assetsByExtension[ext] = [];
        assetsByExtension[ext].push(asset);
    });
    report.public_assets = {
        ...publicAssets,
        by_extension: assetsByExtension
    };

    await browser.close();

    // Git commit info
    try {
        report.git_commit = execSync('git rev-parse HEAD').toString().trim();
    } catch (err) {
        report.git_commit = readlineSync.question('Enter current git commit hash: ') || "null";
        if (report.git_commit === "null") {
            console.error(chalk.red('Failed to get git commit and no input provided:'), err.message || err);
        }
    }

    // Analyze code files
    const certsDir = path.resolve(__dirname, 'certs');
    report.certs = collectAssetData(certsDir, 'Certs', chalk.magenta, certsDir).breakdown;
    for (const key of ['hooks', 'components', 'lib']) {
        await analyzeCodeFiles(key, key, report);
    }
    console.log(chalk.green('✅ Updated special asset breakdown.'));

    // Next.js static chunks
    const nextStaticDir = path.resolve(__dirname, '.next/static');
    report.next_static_chunks = collectAssetData(nextStaticDir, 'Next.js Static Chunks', chalk.gray, nextStaticDir);

    // Complete report
    // Add static ZIP and extracted sizes
    report.vesselEXE = {
        zip_size_mb: 150,
        extracted_size_mb: 318
    };

    // Complete report
    await fs.writeJson(outPath, report, {spaces: 2});
    console.log(chalk.green(`✅ Report saved to ${outPath}`));
    console.log(chalk.blue('🎉 System data gathering complete!'));
})();
