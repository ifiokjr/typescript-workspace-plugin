"use strict";
const fs = require("fs");
const path = require("path");
// Settings for the plugin section in tsconfig.json
/*
interface Settings {

}
*/
function init(_modules) {
    //const _ts = modules.typescript;
    function create(info) {
        let patchedOptions = false;
        let log = (content) => {
            info.project.projectService.logger.info('typescript-workspace-plugin-log ' + content);
        };
        log('---- WORKING ----');
        log('loaded for ' + info.project.getProjectName());
        let rootPath = path.dirname(info.project.getProjectName());
        let initialRootPath = rootPath;
        let rootPkgJson = null;
        do {
            let jsonFile = path.join(rootPath, 'package.json');
            log('Trying ' + jsonFile);
            if (fs.existsSync(jsonFile)) {
                rootPkgJson = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
                let sources = rootPkgJson['workspace-sources'];
                if (sources) {
                    log('Found workspace: ' + JSON.stringify(sources));
                    let pathOptions = {
                        baseUrl: rootPath,
                        paths: {},
                        rootDir: undefined
                    };
                    for (let key of Object.keys(sources)) {
                        if (!pathOptions.paths[key])
                            pathOptions.paths[key] = [];
                        for (let srcPath of sources[key]) {
                            let resolvedPath = path.resolve(rootPath, srcPath);
                            if (pathOptions.paths[key].indexOf(resolvedPath) < 0) {
                                pathOptions.paths[key].unshift(resolvedPath);
                            }
                        }
                    }
                    let oldCOptions = info.project.getCompilerOptions;
                    info.project.getCompilerOptions = function () {
                        let oldOptions = oldCOptions.call(this);
                        if (!patchedOptions) {
                            let oldPaths = Object.keys(oldOptions.paths || {}).reduce((prev, curr) => {
                                let keys = oldOptions.paths[curr].map((p) => path.resolve(initialRootPath, oldOptions.baseUrl, p));
                                return Object.assign({}, prev, { [curr]: keys });
                            }, {}) || {};
                            let newPaths = pathOptions.paths;
                            log('Got old options:' + JSON.stringify(oldOptions));
                            oldOptions = Object.assign(oldOptions, pathOptions, {
                                paths: Object.assign({}, oldPaths, newPaths)
                            });
                            info.project.setCompilerOptions(oldOptions);
                            log('Got new options:' + JSON.stringify(oldOptions));
                            patchedOptions = true;
                        }
                        return oldOptions;
                    };
                    let replacer = (s) => s;
                    let remainingGood = (_s) => true;
                    Object.keys(sources).forEach(p => {
                        let pathVal = sources[p];
                        let replacement = '"' + p.replace('*', '$1') + '"';
                        let searchment = new RegExp('[\'"]' + pathVal[0].replace('*', '(.+)') + '[\'"]');
                        let modulePattern = new RegExp(pathVal[0].replace('*', '(.+)') + '/');
                        let oldReplacer = replacer;
                        let oldTester = remainingGood;
                        replacer = (fileImport) => {
                            let res = oldReplacer(fileImport);
                            let next = res.replace(searchment, replacement);
                            //log(`${res} -> ${next} ;; via ${searchment} -> ${replacement}`);
                            return next;
                        };
                        remainingGood = s => {
                            let old = oldTester(s) && !modulePattern.test(s);
                            return old;
                        };
                    });
                    let cfap = info.languageService.getCodeFixesAtPosition;
                    info.languageService.getCodeFixesAtPosition = function (_fileName) {
                        let results = cfap.apply(this, arguments);
                        results.forEach(res => {
                            if (!res.description.match(/import.+from module/i))
                                return res;
                            res.description = replacer(res.description);
                            res.changes.forEach(c => {
                                c.textChanges.forEach(t => {
                                    t.newText = replacer(t.newText);
                                });
                            });
                        });
                        return results.filter(res => remainingGood(res.description));
                    };
                    break;
                }
                rootPkgJson = null;
            }
            else {
                log('File does not exist: ' + jsonFile);
            }
            let newRoot = path.resolve(rootPath, '..');
            if (newRoot == rootPath)
                break;
            rootPath = newRoot;
        } while (true);
        return info.languageService;
    }
    return { create };
}
module.exports = init;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLHlCQUF5QjtBQUN6Qiw2QkFBNkI7QUFFN0IsbURBQW1EO0FBRW5EOzs7O0VBSUU7QUFFRixTQUFTLElBQUksQ0FBQyxRQUEwQztJQUN0RCxpQ0FBaUM7SUFFakMsU0FBUyxNQUFNLENBQUMsSUFBZ0M7UUFDOUMsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDO1FBQzNCLElBQUksR0FBRyxHQUFHLENBQUMsT0FBWSxFQUFFLEVBQUU7WUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxrQ0FBa0MsR0FBRyxPQUFPLENBQUMsQ0FBQztRQUN4RixDQUFDLENBQUM7UUFFRixHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUV6QixHQUFHLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUVuRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUMzRCxJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUM7UUFFL0IsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLEdBQUc7WUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztZQUNuRCxHQUFHLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQzFCLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDM0IsV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxPQUFP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O1lBQy9CLFFBQVEsR0FBRyxPQUFPLENBQUM7U0FDcEIsUUFBUSxJQUFJLEVBQUU7UUFFZixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDOUIsQ0FBQztJQUVELE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQztBQUNwQixDQUFDO0FBRUQsaUJBQVMsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdHNfbW9kdWxlIGZyb20gJ3R5cGVzY3JpcHQvbGliL3Rzc2VydmVybGlicmFyeSc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBTZXR0aW5ncyBmb3IgdGhlIHBsdWdpbiBzZWN0aW9uIGluIHRzY29uZmlnLmpzb25cblxuLypcbmludGVyZmFjZSBTZXR0aW5ncyB7XG5cbn1cbiovXG5cbmZ1bmN0aW9uIGluaXQoX21vZHVsZXM6IHsgdHlwZXNjcmlwdDogdHlwZW9mIHRzX21vZHVsZSB9KSB7XG4gIC8vY29uc3QgX3RzID0gbW9kdWxlcy50eXBlc2NyaXB0O1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZShpbmZvOiB0cy5zZXJ2ZXIuUGx1Z2luQ3JlYXRlSW5mbykge1xuICAgIGxldCBwYXRjaGVkT3B0aW9ucyA9IGZhbHNlO1xuICAgIGxldCBsb2cgPSAoY29udGVudDogYW55KSA9PiB7XG4gICAgICBpbmZvLnByb2plY3QucHJvamVjdFNlcnZpY2UubG9nZ2VyLmluZm8oJ3R5cGVzY3JpcHQtd29ya3NwYWNlLXBsdWdpbi1sb2cgJyArIGNvbnRlbnQpO1xuICAgIH07XG5cbiAgICBsb2coJy0tLS0gV09SS0lORyAtLS0tJyk7XG5cbiAgICBsb2coJ2xvYWRlZCBmb3IgJyArIGluZm8ucHJvamVjdC5nZXRQcm9qZWN0TmFtZSgpKTtcblxuICAgIGxldCByb290UGF0aCA9IHBhdGguZGlybmFtZShpbmZvLnByb2plY3QuZ2V0UHJvamVjdE5hbWUoKSk7XG4gICAgbGV0IGluaXRpYWxSb290UGF0aCA9IHJvb3RQYXRoO1xuXG4gICAgbGV0IHJvb3RQa2dKc29uID0gbnVsbDtcbiAgICBkbyB7XG4gICAgICBsZXQganNvbkZpbGUgPSBwYXRoLmpvaW4ocm9vdFBhdGgsICdwYWNrYWdlLmpzb24nKTtcbiAgICAgIGxvZygnVHJ5aW5nICcgKyBqc29uRmlsZSk7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhqc29uRmlsZSkpIHtcbiAgICAgICAgcm9vdFBrZ0pzb24gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhqc29uRmlsZSwgJ3V0ZjgnKSk7XG4gICAgICAgIGxldCBzb3VyY2VzID0gcm9vdFBrZ0pzb25bJ3dvcmtzcGFjZS1zb3VyY2VzJ107XG4gICAgICAgIGlmIChzb3VyY2VzKSB7XG4gICAgICAgICAgbG9nKCdGb3VuZCB3b3Jrc3BhY2U6ICcgKyBKU09OLnN0cmluZ2lmeShzb3VyY2VzKSk7XG4gICAgICAgICAgbGV0IHBhdGhPcHRpb25zID0gKHtcbiAgICAgICAgICAgIGJhc2VVcmw6IHJvb3RQYXRoLFxuICAgICAgICAgICAgcGF0aHM6IHt9LFxuICAgICAgICAgICAgcm9vdERpcjogdW5kZWZpbmVkXG4gICAgICAgICAgfSBhcyBhbnkpIGFzIHRzX21vZHVsZS5Db21waWxlck9wdGlvbnM7XG5cbiAgICAgICAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMoc291cmNlcykpIHtcbiAgICAgICAgICAgIGlmICghcGF0aE9wdGlvbnMucGF0aHNba2V5XSkgcGF0aE9wdGlvbnMucGF0aHNba2V5XSA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgc3JjUGF0aCBvZiBzb3VyY2VzW2tleV0pIHtcbiAgICAgICAgICAgICAgbGV0IHJlc29sdmVkUGF0aCA9IHBhdGgucmVzb2x2ZShyb290UGF0aCwgc3JjUGF0aCk7XG4gICAgICAgICAgICAgIGlmIChwYXRoT3B0aW9ucy5wYXRoc1trZXldLmluZGV4T2YocmVzb2x2ZWRQYXRoKSA8IDApIHtcbiAgICAgICAgICAgICAgICBwYXRoT3B0aW9ucy5wYXRoc1trZXldLnVuc2hpZnQocmVzb2x2ZWRQYXRoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBvbGRDT3B0aW9ucyA9IGluZm8ucHJvamVjdC5nZXRDb21waWxlck9wdGlvbnM7XG5cbiAgICAgICAgICBpbmZvLnByb2plY3QuZ2V0Q29tcGlsZXJPcHRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBsZXQgb2xkT3B0aW9ucyA9IG9sZENPcHRpb25zLmNhbGwodGhpcyk7XG4gICAgICAgICAgICBpZiAoIXBhdGNoZWRPcHRpb25zKSB7XG4gICAgICAgICAgICAgIGxldCBvbGRQYXRoczogdHNfbW9kdWxlLk1hcExpa2U8c3RyaW5nW10+ID1cbiAgICAgICAgICAgICAgT2JqZWN0LmtleXMob2xkT3B0aW9ucy5wYXRocyB8fCB7fSkucmVkdWNlKChwcmV2LCBjdXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGtleXMgPSBvbGRPcHRpb25zLnBhdGhzW2N1cnJdLm1hcCgocDogc3RyaW5nKSA9PlxuICAgICAgICAgICAgICAgICAgcGF0aC5yZXNvbHZlKGluaXRpYWxSb290UGF0aCwgb2xkT3B0aW9ucy5iYXNlVXJsLCBwKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHByZXYsIHsgW2N1cnJdOiBrZXlzIH0pO1xuICAgICAgICAgICAgICB9LCB7fSkgfHwge307XG4gICAgICAgICAgICAgIGxldCBuZXdQYXRocyA9IHBhdGhPcHRpb25zLnBhdGhzO1xuICAgICAgICAgICAgICBsb2coJ0dvdCBvbGQgb3B0aW9uczonICsgSlNPTi5zdHJpbmdpZnkob2xkT3B0aW9ucykpO1xuICAgICAgICAgICAgICBvbGRPcHRpb25zID0gT2JqZWN0LmFzc2lnbihvbGRPcHRpb25zLCBwYXRoT3B0aW9ucywge1xuICAgICAgICAgICAgICAgIHBhdGhzOiBPYmplY3QuYXNzaWduKHt9LCBvbGRQYXRocywgbmV3UGF0aHMpXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpbmZvLnByb2plY3Quc2V0Q29tcGlsZXJPcHRpb25zKG9sZE9wdGlvbnMpO1xuICAgICAgICAgICAgICBsb2coJ0dvdCBuZXcgb3B0aW9uczonICsgSlNPTi5zdHJpbmdpZnkob2xkT3B0aW9ucykpO1xuICAgICAgICAgICAgICBwYXRjaGVkT3B0aW9ucyA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gb2xkT3B0aW9ucztcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgbGV0IHJlcGxhY2VyID0gKHM6IHN0cmluZykgPT4gcztcbiAgICAgICAgICBsZXQgcmVtYWluaW5nR29vZCA9IChfczogc3RyaW5nKSA9PiB0cnVlO1xuICAgICAgICAgIE9iamVjdC5rZXlzKHNvdXJjZXMpLmZvckVhY2gocCA9PiB7XG4gICAgICAgICAgICBsZXQgcGF0aFZhbCA9IHNvdXJjZXNbcF07XG4gICAgICAgICAgICBsZXQgcmVwbGFjZW1lbnQgPSAnXCInICsgcC5yZXBsYWNlKCcqJywgJyQxJykgKyAnXCInO1xuICAgICAgICAgICAgbGV0IHNlYXJjaG1lbnQgPSBuZXcgUmVnRXhwKCdbXFwnXCJdJyArIHBhdGhWYWxbMF0ucmVwbGFjZSgnKicsICcoLispJykgKyAnW1xcJ1wiXScpO1xuICAgICAgICAgICAgbGV0IG1vZHVsZVBhdHRlcm4gPSBuZXcgUmVnRXhwKHBhdGhWYWxbMF0ucmVwbGFjZSgnKicsICcoLispJykgKyAnLycpO1xuICAgICAgICAgICAgbGV0IG9sZFJlcGxhY2VyID0gcmVwbGFjZXI7XG4gICAgICAgICAgICBsZXQgb2xkVGVzdGVyID0gcmVtYWluaW5nR29vZDtcbiAgICAgICAgICAgIHJlcGxhY2VyID0gKGZpbGVJbXBvcnQpID0+IHtcbiAgICAgICAgICAgICAgbGV0IHJlcyA9IG9sZFJlcGxhY2VyKGZpbGVJbXBvcnQpO1xuICAgICAgICAgICAgICBsZXQgbmV4dCA9IHJlcy5yZXBsYWNlKHNlYXJjaG1lbnQsIHJlcGxhY2VtZW50KTtcbiAgICAgICAgICAgICAgLy9sb2coYCR7cmVzfSAtPiAke25leHR9IDs7IHZpYSAke3NlYXJjaG1lbnR9IC0+ICR7cmVwbGFjZW1lbnR9YCk7XG4gICAgICAgICAgICAgIHJldHVybiBuZXh0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJlbWFpbmluZ0dvb2QgPSBzID0+IHtcbiAgICAgICAgICAgICAgbGV0IG9sZCA9IG9sZFRlc3RlcihzKSAmJiAhbW9kdWxlUGF0dGVybi50ZXN0KHMpO1xuICAgICAgICAgICAgICByZXR1cm4gb2xkO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxldCBjZmFwID0gaW5mby5sYW5ndWFnZVNlcnZpY2UuZ2V0Q29kZUZpeGVzQXRQb3NpdGlvbjtcblxuICAgICAgICAgIGluZm8ubGFuZ3VhZ2VTZXJ2aWNlLmdldENvZGVGaXhlc0F0UG9zaXRpb24gPSBmdW5jdGlvbihcbiAgICAgICAgICAgIF9maWxlTmFtZTogc3RyaW5nXG4gICAgICAgICAgKTogUmVhZG9ubHlBcnJheTx0cy5Db2RlRml4QWN0aW9uPiB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0cyA9IGNmYXAuYXBwbHkodGhpcywgYXJndW1lbnRzKSBhcyBSZWFkb25seUFycmF5PHRzLkNvZGVGaXhBY3Rpb24+O1xuICAgICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKHJlcyA9PiB7XG4gICAgICAgICAgICAgIGlmICghcmVzLmRlc2NyaXB0aW9uLm1hdGNoKC9pbXBvcnQuK2Zyb20gbW9kdWxlL2kpKSByZXR1cm4gcmVzO1xuICAgICAgICAgICAgICByZXMuZGVzY3JpcHRpb24gPSByZXBsYWNlcihyZXMuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgICByZXMuY2hhbmdlcy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgICAgICAgIGMudGV4dENoYW5nZXMuZm9yRWFjaCh0ID0+IHtcbiAgICAgICAgICAgICAgICAgIHQubmV3VGV4dCA9IHJlcGxhY2VyKHQubmV3VGV4dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cy5maWx0ZXIocmVzID0+IHJlbWFpbmluZ0dvb2QocmVzLmRlc2NyaXB0aW9uKSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJvb3RQa2dKc29uID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZygnRmlsZSBkb2VzIG5vdCBleGlzdDogJyArIGpzb25GaWxlKTtcbiAgICAgIH1cblxuICAgICAgbGV0IG5ld1Jvb3QgPSBwYXRoLnJlc29sdmUocm9vdFBhdGgsICcuLicpO1xuICAgICAgaWYgKG5ld1Jvb3QgPT0gcm9vdFBhdGgpIGJyZWFrO1xuICAgICAgcm9vdFBhdGggPSBuZXdSb290O1xuICAgIH0gd2hpbGUgKHRydWUpO1xuXG4gICAgcmV0dXJuIGluZm8ubGFuZ3VhZ2VTZXJ2aWNlO1xuICB9XG5cbiAgcmV0dXJuIHsgY3JlYXRlIH07XG59XG5cbmV4cG9ydCA9IGluaXQ7XG4iXX0=