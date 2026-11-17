# Personal website

A small static website. No packages or build step are needed.

## Edit

Edit `index.html` to change the name, introduction, and links. To add a handout,
create a `handouts` folder, put your PDF there, and replace the empty-state
paragraph with a list of links. A sample list is included in an HTML comment.
Use relative paths such as `handouts/algebra.pdf` so links work on GitHub Pages.
Edit `style.css` to adjust the appearance.

## Check locally

From this directory, run:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

## Publish on GitHub Pages

Push these files to the `main` branch of `ammarashary14/website`.
In the repository's **Settings → Pages**, select **Deploy from a branch**,
choose **main** and **/ (root)**, then save.
Once GitHub deploys it, the site will be at:

https://ammarashary14.github.io/website/

No custom domain is needed. For the shorter address
`https://ammarashary14.github.io/`, the repository must instead be named
`ammarashary14.github.io`.
