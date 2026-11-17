# Catégories pour le mathématicien ivre

A small static website. No packages or build step are needed.

## Edit

Choose **Edit website** in the footer to open the editor. Change the title,
name, bio, handout links, or social links, then preview the result. **Save draft**
keeps a copy in that browser. **Download index.html** exports the updated page;
upload it to the repository root with GitHub's upload page and commit to `main`
to publish. If your browser renames the download, rename it to `index.html` first.
The editor is public, but drafts do not change the live site. Only GitHub
repository collaborators can publish. No password or token is stored by the editor.

To host a PDF, create a `handouts` folder in the repository and upload it there.
Use a relative link such as `handouts/algebra.pdf` in the editor. External
document links also work. AoPS and Discord buttons copy your usernames until
you add direct profile or invite URLs. Gmail and YouTube already link directly.

You can also edit `index.html` manually. Keep its IDs and `data-social`
attributes so the editor can read it. Edit `style.css` to adjust the appearance.

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

The static homepage works without JavaScript; the editor and username-copy
buttons use small local scripts. No custom domain is needed. For the shorter address
`https://ammarashary14.github.io/`, the repository must instead be named
`ammarashary14.github.io`.
