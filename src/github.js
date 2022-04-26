import $ from 'jquery';

/**************************************************
 * FOR GITHUB
 **************************************************/

/**
* init element
*/
function initNewElementForGitHub() {
    var bntCopyPath = '';
    bntCopyPath = bntCopyPath + '<li>';
    bntCopyPath = bntCopyPath + '   <notifications-list-subscription-form id="pg_copy_path" class="f5 position-relative d-flex">';
    bntCopyPath = bntCopyPath + '       <span style="background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(180,200,208,1) 0%, rgba(99,250,241,1) 100%)" class="btn btn-sm">Copy all file path</span>';
    bntCopyPath = bntCopyPath + '   </notifications-list-subscription-form>';
    bntCopyPath = bntCopyPath + '</li>';

    var btnOverview = '';
    btnOverview = btnOverview + '<li>';
    btnOverview = btnOverview + '   <notifications-list-subscription-form id="pg_copy_overview" class="f5 position-relative d-flex">';
    btnOverview = btnOverview + '       <span style="background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(180,200,208,1) 0%, rgba(99,250,241,1) 100%)" class="btn btn-sm">Count LOC & get details clipboard</span>';
    btnOverview = btnOverview + '   </notifications-list-subscription-form>';
    btnOverview = btnOverview + '</li>';

    var processText = `<p id="pg_process_log" style="position: fixed; top: 60px; right: 20px; z-index: 999; color: red;"></p>`;

    $('.pagehead-actions').prepend(bntCopyPath);
    $('.pagehead-actions').prepend(btnOverview);
    $('.pagehead-actions').prepend(processText);
}

function copyPathForGitHub() {
    var list = document.getElementsByClassName("file-info");
    var str = "";
    for (var i = 0; i < list.length; i++) {
        var item = list[i].getElementsByTagName("a");
        str += item[0].getAttribute("title") + "\n";
    }

    navigator.clipboard.writeText(str).then(function () {
        alert('Copying to clipboard was successful!');
    }, function (err) {
        alert('Could not copy text: ', err);
    });
}

/**
 * Count theo công thức  (new + modify*2 + motherbody*0.06)
 * return: number of line of code
*/
async function countLineOfCodeForGitHub(diffFileList) {
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
        var htmlName = diffFileList[i].querySelector("a.Link--primary");
        var name = htmlName.innerText;

        console.log("---------------");
        console.log("File name: " + name);

        $('#pg_process_log').text(`${name} [${i + 1}/${diffFileList.length}]`);
        if (!name.includes("/test/")) {
            // get added line and removed line
            var newLineElements = diffFileList[i].getElementsByClassName("blob-code-addition");
            var oldLineElements = diffFileList[i].getElementsByClassName("blob-code-deletion");

            var baseDomain = window.location.origin;

            // make filepath for get mother body
            var fileUrlPath = diffFileList[i].querySelector("a.pl-5.dropdown-item.btn-link").getAttribute("href");
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
    initNewElementForGitHub();

    $('#pg_copy_path').on('click', function () {
        copyPathForGitHub();
    });

    $('#pg_copy_overview').on('click', async function () {
        var listDiffFiles = document.getElementsByClassName("file js-file js-details-container js-targetable-element Details Details--on open show-inline-notes");

        let loc = await countLineOfCodeForGitHub(listDiffFiles);
        show(loc, 0);
    });
}

export const github = () => { regist() }