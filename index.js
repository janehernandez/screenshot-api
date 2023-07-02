const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.use(express.static("public"));

//Serves all the request which includes /images in the url from Images folder
app.use("/images", express.static(__dirname + "/images"));

app.get("/", async (req, res) => {
  res.send({
    message: "Hello World",
  });
});

app.get("/screenshot", async (req, res) => {
  const browser = await puppeteer.launch({
    defaultViewport: { width: 904, height: 1350 },
  });

  try {
    const page = await browser.newPage({
      defaultViewport: { width: 904, height: 1350 },
    });
    await page.setViewport({ width: 904, height: 1350 });

    let selector =
      "#root > div > div > section > div.ovf-y-auto.ovf-x-hide.h-center.mainBodyScroll.full-height > main > section > main > div";

    if (req.query.dev) {
      selector = "body";
    }

    if (!req.query.dev) {
      await page.evaluateOnNewDocument((token) => {
        localStorage.clear();
        localStorage.setItem("AUTH_INFO", token);
      }, req.query.auth_info);
    }

    const url = req.query.dev ? "https://google.com" : req.query.url;
    await page.goto(url, {
      waitUntil: "networkidle0",
    });

    let element = await page.$(selector);
    await page.waitForSelector(selector, { waitUntil: "networkidle0" });

    await Promise.all([
      page.evaluate((el) => {
        const headerImage = document.createElement("img");
        headerImage.src =
          "https://res.cloudinary.com/dqlbxmeez/image/upload/v1688302132/bg_l6xkpf.png";
        headerImage.style.margin = "auto";
        headerImage.style.display = "block";
        headerImage.style.paddingTop = "30px";
        headerImage.style.width = "100%";

        el.insertBefore(headerImage, el.firstChild);

        // el.style.border = "5px solid red";

        const footer = document.createElement("img");
        footer.src =
          "https://res.cloudinary.com/dqlbxmeez/image/upload/v1688302131/footer_p496u7.png";
        footer.style.margin = "auto";
        footer.style.display = "block";
        footer.style.width = "100%";
        el.appendChild(footer);

        return new Promise((resolve) => {
          headerImage.onload = resolve;
          footer.onload = resolve;
        });
      }, element),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    await Promise.all([
      page.waitForSelector(
        'img[src="https://res.cloudinary.com/dqlbxmeez/image/upload/v1688302132/bg_l6xkpf.png"]',
        {
          waitUntil: "networkidle0",
        }
      ),
      page.waitForSelector(
        'img[src="https://res.cloudinary.com/dqlbxmeez/image/upload/v1688302131/footer_p496u7.png"]',
        {
          waitUntil: "networkidle0",
        }
      ),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 3000));
    // const boundingBox = await element.boundingBox();

    // Evaluate element selector
    const boundingBox = await page.evaluate((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { left: x, top: y, width, height };
    }, element);

    const name = req.query.name;
    const timestamp = Math.floor(Date.now() / 1000);

    const filename = `${name}_${timestamp}.png`;

    await page.screenshot({
      path: `public/images/${filename}`,
      clip: {
        x: boundingBox.left - 32,
        y: boundingBox.top - 32,
        width: boundingBox.width + 64,
        height: boundingBox.height + 100,
      },
    });

    await browser.close();

    res.send({
      path: `/images/${filename}`,
    });
  } catch (error) {
    await browser.close();
    res.send({
      message: "please try again",
      error,
    });
  }
});

app.listen(3003, () => {
  console.log("Server listening on port 3003");
});
