/* global chrome */
import { gitlab } from './gitlab';
import { github } from './github';

function init() {
    let url = window.location.href;
    let isGitHub = url.indexOf("github.com") !== -1;
    let isGitLab = url.indexOf("gitlab.com") !== -1;

    if (isGitHub) {
        console.log("Checked site is github.");
        chrome.runtime.sendMessage({ from: "github", badgeText: "hub" });
        github();
    } else if (isGitLab) {
        console.log("Checked site is gitlab.");
        chrome.runtime.sendMessage({ from: "gitlab", badgeText: "lab" });
        gitlab();
    }
}

/* Start content script */ init();