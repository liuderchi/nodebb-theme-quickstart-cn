"use strict";

/* globals document, $ */

// retry a function () => Promise, with cooldown and maximum retries
// https://gist.github.com/briancavalier/842626#gistcomment-2703073
var retry = (fn, retriesLeft = 5, interval = 1000) => {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch(error => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject(error);
            return;
          }
          retry(fn, interval, retriesLeft - 1).then(resolve, reject);
        }, interval);
      });
  });
};

var oldURL = "window.location.href";
function checkUrlChange(cb) {
  if (window.location.href != oldURL) {
    cb(window.location.href);
  }

  oldURL = window.location.href;
  setInterval(function() {
    checkUrlChange(cb);
  }, 1000);
}

$(document).ready(function() {
  // fetch categories
  let categories = [];
  if (location && location.origin) {
    fetch(`${location.origin}/api`)
      .then(r => r.json())
      .then(data => {
        categories = (data.categories || []).map(({ name, icon, slug }) => {
          const htmlDesktop = `<li class=""><a class="navigation-link" href="/category/${slug}" title="" data-original-title="${name}"><i class="fa fa-fw ${icon}" data-content=""></i><span> ${name}</span></a></li>`;
          const htmlMobile = `<li class=""><a class="navigation-link" href="/category/${slug}" title="" data-original-title="${name}"><i class="fa fa-fw ${icon}" data-content=""></i><span class="visible-xs-inline"> ${name}</span></a></li>`;
          return {
            name,
            icon,
            href: `/category/${slug}`,
            htmlDesktop,
            htmlMobile
          };
        });
        // Sidebar (desktop)
        checkUrlChange(() => {
          const rowDom = document.querySelector("div#content > div.row");
          rowDom &&
            rowDom.prepend(
              $.parseHTML(
                `<ul class="sidebar col-lg-3" >${categories
                  .map(c => c.htmlDesktop)
                  .join("")}</ul>`
              )[0]
            );
          rowDom &&
            rowDom.querySelector(".col-lg-12") &&
            $(rowDom.querySelector(".col-lg-12"))
              .removeClass("col-lg-12")
              .addClass("col-lg-9");
        });

        // Sidebar (mobile)
        retry(
          () => {
            const ulDom = document.querySelector("ul.menu-section-list");
            const liDom = ulDom.querySelector("li:nth-child(2)");
            if (!liDom) return Promise.reject("side bar is not ready");

            categories.forEach(c => {
              ulDom.insertBefore($.parseHTML(c.htmlMobile)[0], liDom);
            });
            return Promise.resolve("done");
          },
          5,
          500
        );
      })
      .catch(console.error);
  }
});
