import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const dictionary = JSON.parse(
    fs.readFileSync(path.join(root, 'resources/js/locales/fil.json'), 'utf8'),
);
const source = fs.readFileSync(
    path.join(root, 'resources/js/lib/i18n.ts'),
    'utf8',
);
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
    },
}).outputText;
function translator() {
    const exports = {};
    const document = { documentElement: { lang: 'en' } };
    vm.runInNewContext(compiled, {
        exports,
        document,
        require: (name) =>
            name === '@/locales/fil.json' ? dictionary : require(name),
    });
    return { ...exports, document };
}

await test('switching languages updates interface text, placeholders and document language', () => {
    const i18n = translator();
    assert.equal(i18n.t('Save changes'), 'Save changes');
    i18n.setLocale('fil');
    assert.equal(i18n.document.documentElement.lang, 'fil');
    assert.equal(i18n.t('Save changes'), 'I-save ang mga pagbabago');
    assert.equal(
        i18n.t('View :0', { 0: 'SM Sta. Rosa' }),
        'Tingnan ang SM Sta. Rosa',
    );
    assert.equal(i18n.t('SM Sta. Rosa'), 'SM Sta. Rosa');
    assert.equal(i18n.t('1250.50'), '1250.50');
    i18n.setLocale('en');
    assert.equal(i18n.t('Save changes'), 'Save changes');
});

await test('every explicitly translated interface literal has a catalog entry', () => {
    const files = (folder) =>
        fs
            .readdirSync(folder, { withFileTypes: true })
            .flatMap((entry) =>
                entry.isDirectory()
                    ? files(path.join(folder, entry.name))
                    : [path.join(folder, entry.name)],
            );
    const missing = new Set();
    for (const file of files(path.join(root, 'resources/js')).filter(
        (file) =>
            /\.tsx?$/.test(file) &&
            !file.includes(`${path.sep}lib${path.sep}i18n.ts`),
    )) {
        const source = ts.createSourceFile(
            file,
            fs.readFileSync(file, 'utf8'),
            ts.ScriptTarget.Latest,
            true,
            file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
        );
        function visit(node) {
            if (
                ts.isCallExpression(node) &&
                node.expression.getText(source) === 't' &&
                node.arguments[0] &&
                ts.isStringLiteral(node.arguments[0]) &&
                /[A-Za-z]/.test(node.arguments[0].text) &&
                !(node.arguments[0].text in dictionary)
            )
                missing.add(node.arguments[0].text);
            ts.forEachChild(node, visit);
        }
        visit(source);
    }
    assert.deepEqual([...missing], []);
});

await test('server and client use identical translations for shared feedback', () => {
    assert.deepEqual(
        JSON.parse(fs.readFileSync(path.join(root, 'lang/fil.json'), 'utf8')),
        dictionary,
    );
});

await test('preference saves reject login redirects and failed acknowledgements', async () => {
    const source = fs.readFileSync(
        path.join(root, 'resources/js/lib/preferences.ts'),
        'utf8',
    );
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
        },
    }).outputText;
    async function save(response) {
        const exports = {};
        vm.runInNewContext(compiled, {
            exports,
            document: { cookie: 'XSRF-TOKEN=token' },
            fetch: async () => response,
        });
        return exports.savePreferences({ locale: 'fil' });
    }
    await assert.rejects(
        save({
            ok: true,
            headers: { get: () => 'text/html' },
            json: async () => ({}),
        }),
    );
    await assert.rejects(
        save({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({ saved: false }),
        }),
    );
    await assert.doesNotReject(
        save({
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({ saved: true }),
        }),
    );
});
