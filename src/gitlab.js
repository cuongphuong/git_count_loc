import $ from 'jquery';

/**************************************************
 * FOR GITLAB
 **************************************************/
function copyPathForGitLab() {

    let isMergeRequest = window.location.href.indexOf("/merge_requests/") !== -1;
    let isSearch = window.location.href.indexOf("/search?") !== -1;
    let pathString = "";

    if (isMergeRequest) {
        // use for merge request
        const pathSet = new Set();
        $('.file-title-name').each(function (index, item) {
            pathSet.add(item.innerText.trim());
        });

        pathString = Array.from(pathSet).join('\n')
    } else if (isSearch) {
        try {
            pathString = $('.js-file-title.file-title strong').text();
            let array = pathString.split(/\r?\n/);
            array = array.filter(el => { return el && el.trim() !== ""; });
            let uniq = [...new Set(array)];
            pathString = uniq.join("\n");
        } catch (ex) {
            pathString = ":D"
        }
    } else {
        // use for commit and compare
        $('.file-title-name').each(function () {
            pathString += $(this).attr("data-title") + "\n";
        })
    }

    navigator.clipboard.writeText(pathString).then(function () {
        alert('Copying to clipboard was successful!');
    }, function (err) {
        alert('Could not copy text: ', err);
    });
}

/**
 * Count theo công thức  (new + modify*2 + motherbody*0.06)
 * return: number of line of code
*/
async function countLineOfCodeForGitLab(diffFileList) {
    var lineOfCode = 0;
    let lineOfCodeMsg = [];

    // get origin version
    let compareVersionElm = $('.breadcrumbs-sub-title').find('a')[0];
    let compareVersion = compareVersionElm ? compareVersionElm.innerText.substring(0, compareVersionElm.innerText.indexOf("...")) : '';

    let version = prompt("Origin version (Default master)?", compareVersion ? compareVersion : "master");
    if (version && version.trim() !== "") {
        compareVersion = version;
    } else {
        return;
    }

    $('#pg_process_log').css("background", "#ddd");
    for (var i = 0; i < diffFileList.length; i++) {
        var htmlName = diffFileList[i].querySelector("strong.file-title-name.has-tooltip");
        var name = htmlName.innerText;

        console.log("---------------");
        console.log("File name: " + name);

        $('#pg_process_log').text(`${name} [${i + 1}/${diffFileList.length}]`);
        if (!name.includes("/test/")) {

            // get added line and removed line
            var newLineElements = diffFileList[i].getElementsByClassName("line_holder new");
            var oldLineElements = diffFileList[i].getElementsByClassName("line_holder old");

            var baseDomain = window.location.origin;

            // make filepath for get mother body
            var fileUrlPath = "";
            var buttons = diffFileList[i].getElementsByClassName("btn");
            for (let j = 0; j < buttons.length; j++) {
                let innerTextOfBtn = buttons[j].innerText;
                if (innerTextOfBtn && innerTextOfBtn.includes("View file")) {
                    fileUrlPath = buttons[j].getAttribute("href");
                }
            }

            fileUrlPath = fileUrlPath.split("/");
            let indexOfViewType = fileUrlPath.indexOf("blob");
            fileUrlPath[indexOfViewType] = "raw";
            fileUrlPath[indexOfViewType + 1] = compareVersion;
            fileUrlPath = fileUrlPath.join("/");

            let response;
            let status;
            try {
                // read file from url
                response = await fetch(baseDomain + fileUrlPath);
                status = await response.status;
            } catch (ex) {
                console.log("Ignore: fail to fetch url");
                continue;
            }

            let modify = 0;
            let added = 0;
            let motherbody = 0;

            if (status === 200) {
                let content = await response.text();
                motherbody = content.split(/\r\n|\r|\n/).length;
            }

            let gitAdded = newLineElements.length;
            let gitDeleted = oldLineElements.length;

            if (gitAdded === 0) {
                // Chỉ delete
                added = 0;
                modify = gitDeleted;
            }

            if (gitDeleted === 0) {
                // Chỉ add thì không có modify
                added = gitAdded;
                modify = 0;
            }

            if (gitDeleted >= gitAdded && gitAdded > 0) {
                // Nếu số lượng line xóa nhiều hơn add thì lấy add * 2(modify) bỏ line xóa
                modify = gitAdded;
                added = 0
            }

            if (gitDeleted < gitAdded && gitDeleted > 0) {
                // Nếu số lượng line add nhiều hơn del thì lấy add * 2(modify) bỏ line xóa
                modify = gitDeleted;
                added = (gitAdded - gitDeleted);
            }

            // new + modify*2 + motherbody*0.06
            let locOfFile = added + modify * 2 + motherbody * 0.06;

            console.log("Added: " + added);
            console.log("Modify: " + modify);
            console.log("MotherBody: " + motherbody + " (fetch: " + baseDomain + fileUrlPath + ")");
            console.log("LOC of file: " + locOfFile);
            lineOfCode += locOfFile;
            lineOfCodeMsg.push(`${name}\t${added}\t${modify}\t${motherbody}\t${Math.round(locOfFile)}`)
        } else {
            console.log("Skip because test file.");
        }
    }

    $('#pg_process_log').text("");
    $('#pg_process_log').css("background", "none");
    return {
        lineOfCode, lineOfCodeMsg
    };
}

function countUTTestCaseForGitLab(diffFileList) {
    var selectorOfNewTestCase = "td.line_content.new";
    var selectorOfOldTestCase = "td.line_content.old";
    var numOfTestCase = 0;
    for (var i = 0; i < diffFileList.length; i++) {
        var newLineElements = diffFileList[i].getElementsByClassName("line_holder new");
        var oldLineElements = diffFileList[i].getElementsByClassName("line_holder old");
        numOfTestCase = numOfTestCase + countTestFromFileForGitLab(newLineElements, selectorOfNewTestCase); // count test case new
        numOfTestCase = numOfTestCase + countTestFromFileForGitLab(oldLineElements, selectorOfOldTestCase); // count test case remove
    }
    return numOfTestCase;
}

/**
* return: number of test case on a diff file
*/
function countTestFromFileForGitLab(lineElement, selector) {
    var numberOfTestFile = 0;
    if (lineElement === undefined || lineElement.length === 0) {
        return false;
    }
    for (var i = 0; i < lineElement.length; i++) {
        var contentElement = lineElement[i].querySelector(selector);
        var testElement = contentElement.querySelector("span.line > span");
        if (testElement !== null) {
            // check @Test test case
            var str = testElement.textContent;
            if (str.trim() === "@Test") {
                numberOfTestFile++;
            }
        }
    }
    return numberOfTestFile;
}

/**
* init element
*/
function initNewElementForGitLab() {

    let isMergeRequest = window.location.href.indexOf("/merge_requests/") !== -1;
    let isSearch = window.location.href.indexOf("/search?") !== -1;
    // Copy path button for merge_request page
    if (isMergeRequest) {
        let btnCopyOnMerge = '';
        btnCopyOnMerge = btnCopyOnMerge + '<button style="background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(180,200,208,1) 0%, rgba(99,250,241,1) 100%)" id="pg_copy_path" class="d-none d-md-block btn gl-button btn-grouped js-issuable-edit qa-edit-button">        ';
        btnCopyOnMerge = btnCopyOnMerge + '    Copy all file path';
        btnCopyOnMerge = btnCopyOnMerge + '</button>';

        $('.clearfix.issue-btn-group').prepend(btnCopyOnMerge);
    }


    if (isSearch) {
        let btnCopyOnMerge = '';
        btnCopyOnMerge = btnCopyOnMerge + '<button style="background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(180,200,208,1) 0%, rgba(99,250,241,1) 100%)" id="pg_copy_path" class="d-none d-md-block btn gl-button btn-grouped js-issuable-edit qa-edit-button">        ';
        btnCopyOnMerge = btnCopyOnMerge + '    Copy all file path';
        btnCopyOnMerge = btnCopyOnMerge + '</button>';

        $('.row-content-block.gl-display-flex').append(btnCopyOnMerge);
    }

    // for commit and compare page
    var bntCopyPath = '';
    bntCopyPath = bntCopyPath + '<button style="background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(180,200,208,1) 0%, rgba(99,250,241,1) 100%)" id="pg_copy_path" type="button" class="btn btn-default pg_button">';
    bntCopyPath = bntCopyPath + '    Copy all file path';
    bntCopyPath = bntCopyPath + '</button>';

    var btnOverview = '';
    btnOverview = btnOverview + '<button style="background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(180,200,208,1) 0%, rgba(99,250,241,1) 100%); margin-right: 5px !important;" id="pg_copy_overview" type="button" class="btn btn-default pg_button">';
    btnOverview = btnOverview + '    Count LOC & get details clipboard';
    btnOverview = btnOverview + '</button>';

    var processText = `<p id="pg_process_log" style="position: fixed; top: 60px; right: 20px; z-index: 999; color: red;"></p>`;

    $('.inline-parallel-buttons').prepend(bntCopyPath);
    $('.inline-parallel-buttons').prepend(btnOverview);
    $('.container-fluid').prepend(processText);
}

function show(loc, utCase) {
    navigator.clipboard.writeText(loc.lineOfCodeMsg.join("\n")).then(function () {
        var nofi = "Đã copy vào clipboard.\n";
        nofi = nofi + "LOC: " + Math.round(loc.lineOfCode) + "\n" + "UTC: " + utCase + ".";

        alert(nofi);
    }, function (err) {
        alert('Could not copy text: ', err);
    });
}

function regist() {
    // for GitLab
    initNewElementForGitLab();

    // Đăng kí sự kiện
    $('#pg_copy_path').on('click', function () {
        copyPathForGitLab();
    });

    $('#pg_copy_overview').on('click', async function () {
        var listDiffFiles = document.getElementsByClassName("diff-file file-holder");
        let loc = await countLineOfCodeForGitLab(listDiffFiles);
        let utc = countUTTestCaseForGitLab(listDiffFiles);
        show(loc, utc);
    });
}

export const gitlab = () => { regist() }