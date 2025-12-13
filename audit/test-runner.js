#!/usr/bin/env node

/**
 * نظام تشغيل الاختبارات الآلي لمشروع SynapsePay
 * يدير تشغيل جميع أنواع الاختبارات ويولد تقارير مفصلة
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
        
        this.reportsDir = path.join(__dirname, 'reports');
        this.ensureReportsDir();
    }

    ensureReportsDir() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[34m',    // Blue
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };

        const timestamp = new Date().toISOString();
        const colorCode = colors[type] || colors.info;
        console.log(`${colorCode}[${timestamp}] ${message}${colors.reset}`);
    }

    async runCommand(command, options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn('sh', ['-c', command], {
                cwd: options.cwd || process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({
                    code,
                    stdout,
                    stderr,
                    success: code === 0
                });
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }

    async runTest(testConfig) {
        const { name, command, cwd, timeout = 300000 } = testConfig;
        
        this.log(`تشغيل اختبار: ${name}`, 'info');
        
        const startTime = Date.now();
        
        try {
            const result = await Promise.race([
                this.runCommand(command, { cwd }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), timeout)
                )
            ]);

            const duration = Date.now() - startTime;
            
            const testResult = {
                name,
                success: result.success,
                duration,
                stdout: result.stdout,
                stderr: result.stderr,
                timestamp: new Date().toISOString()
            };

            this.results.tests.push(testResult);
            this.results.total++;

            if (result.success) {
                this.results.passed++;
                this.log(`✅ ${name} - نجح (${duration}ms)`, 'success');
            } else {
                this.results.failed++;
                this.log(`❌ ${name} - فشل (${duration}ms)`, 'error');
                this.log(`خطأ: ${result.stderr}`, 'error');
            }

            // حفظ مخرجات الاختبار
            const outputFile = path.join(this.reportsDir, `${name.replace(/\s+/g, '-').toLowerCase()}.txt`);
            fs.writeFileSync(outputFile, `${result.stdout}\n\n--- STDERR ---\n${result.stderr}`);

            return testResult;

        } catch (error) {
            const duration = Date.now() - startTime;
            
            const testResult = {
                name,
                success: false,
                duration,
                error: error.message,
                timestamp: new Date().toISOString()
            };

            this.results.tests.push(testResult);
            this.results.total++;
            this.results.failed++;

            this.log(`❌ ${name} - خطأ: ${error.message}`, 'error');
            return testResult;
        }
    }

    async runAllTests() {
        this.log('🚀 بدء تشغيل جميع الاختبارات...', 'info');

        const testSuite = [
            {
                name: 'Contract Build Registry',
                command: 'cargo build-sbf --manifest-path programs/synapsepay-registry/Cargo.toml',
                cwd: path.join(__dirname, '..')
            },
            {
                name: 'Contract Build Payments',
                command: 'cargo build-sbf --manifest-path programs/synapsepay-payments/Cargo.toml',
                cwd: path.join(__dirname, '..')
            },
            {
                name: 'Contract Build Scheduler',
                command: 'cargo build-sbf --manifest-path programs/synapsepay-scheduler/Cargo.toml',
                cwd: path.join(__dirname, '..')
            },
            {
                name: 'Security Check Script',
                command: './audit/security-check.sh',
                cwd: path.join(__dirname, '..')
            }
        ];

        // تشغيل اختبارات TypeScript إذا كانت متوفرة
        const tsTestDir = path.join(__dirname, 'property-tests-ts');
        if (fs.existsSync(tsTestDir)) {
            testSuite.push({
                name: 'TypeScript Property Tests',
                command: 'npm test',
                cwd: tsTestDir
            });
        }

        // تشغيل الاختبارات بالتتابع
        for (const test of testSuite) {
            await this.runTest(test);
        }

        this.generateReport();
        this.printSummary();

        return this.results.failed === 0;
    }

    generateReport() {
        const report = {
            summary: {
                timestamp: new Date().toISOString(),
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                skipped: this.results.skipped,
                successRate: Math.round((this.results.passed / this.results.total) * 100)
            },
            tests: this.results.tests
        };

        // تقرير JSON
        const jsonReport = path.join(this.reportsDir, 'test-results.json');
        fs.writeFileSync(jsonReport, JSON.stringify(report, null, 2));

        // تقرير Markdown
        const mdReport = this.generateMarkdownReport(report);
        const mdReportFile = path.join(this.reportsDir, 'test-results.md');
        fs.writeFileSync(mdReportFile, mdReport);

        this.log(`📊 التقارير محفوظة في: ${this.reportsDir}`, 'info');
    }

    generateMarkdownReport(report) {
        const { summary, tests } = report;
        
        let md = `# تقرير نتائج الاختبارات - SynapsePay\n\n`;
        md += `## الملخص\n\n`;
        md += `- **التاريخ**: ${summary.timestamp}\n`;
        md += `- **إجمالي الاختبارات**: ${summary.total}\n`;
        md += `- **الناجحة**: ${summary.passed}\n`;
        md += `- **الفاشلة**: ${summary.failed}\n`;
        md += `- **المتخطاة**: ${summary.skipped}\n`;
        md += `- **معدل النجاح**: ${summary.successRate}%\n\n`;

        md += `## تفاصيل الاختبارات\n\n`;
        md += `| الاختبار | النتيجة | المدة | الوقت |\n`;
        md += `|----------|---------|-------|-------|\n`;

        tests.forEach(test => {
            const status = test.success ? '✅ نجح' : '❌ فشل';
            const duration = `${test.duration}ms`;
            const time = new Date(test.timestamp).toLocaleTimeString('ar-SA');
            md += `| ${test.name} | ${status} | ${duration} | ${time} |\n`;
        });

        md += `\n## التوصيات\n\n`;
        if (summary.failed === 0) {
            md += `✅ **جميع الاختبارات نجحت!**\n\n`;
            md += `- يمكن المتابعة لمرحلة النشر على devnet\n`;
            md += `- تأكد من إعداد متغيرات البيئة بشكل صحيح\n`;
            md += `- قم بمراجعة العقود قبل النشر النهائي\n`;
        } else {
            md += `⚠️ **يوجد اختبارات فاشلة تحتاج إصلاح**\n\n`;
            md += `- راجع تفاصيل الأخطاء في الملفات المرفقة\n`;
            md += `- أصلح المشاكل المكتشفة\n`;
            md += `- أعد تشغيل الاختبارات بعد الإصلاح\n`;
        }

        return md;
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 ملخص نتائج الاختبارات');
        console.log('='.repeat(50));
        console.log(`إجمالي الاختبارات: ${this.results.total}`);
        console.log(`الناجحة: ${this.results.passed}`);
        console.log(`الفاشلة: ${this.results.failed}`);
        console.log(`المتخطاة: ${this.results.skipped}`);
        console.log(`معدل النجاح: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
        console.log('='.repeat(50));

        if (this.results.failed === 0) {
            this.log('🎉 جميع الاختبارات نجحت! النظام جاهز للمرحلة التالية.', 'success');
        } else {
            this.log(`⚠️ ${this.results.failed} اختبار فشل. راجع التقارير للتفاصيل.`, 'warning');
        }
    }
}

// تشغيل النظام إذا تم استدعاؤه مباشرة
if (require.main === module) {
    const runner = new TestRunner();
    
    runner.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('خطأ في تشغيل الاختبارات:', error);
            process.exit(1);
        });
}

module.exports = TestRunner;