# Catégories pour le mathématicien ivre

A small static website. No packages or build step are needed.

The public page uses a plain white background, black serif text, and standard
blue links. Domain setup for `ammarashary.cc` is documented in
[DOMAIN_SETUP.md](DOMAIN_SETUP.md), including Cloudflare Pages for a private
repository and the GitHub Pages alternative. The domain is not connected yet.

## Edit

Choose **Editor dashboard** in the footer. Its Overview, About, Handouts,
Photos, Links, and Publish panels manage the whole page. Change the title,
name, bio, handouts, photos, or social links, then preview the result. **Save draft**
keeps a copy on that device, including photos. **Download page** exports the updated page;
upload it to the repository root with GitHub's upload page and commit to `main`
to publish. If your browser renames the download, rename it to `index.html` first.
The editor is public, but drafts do not change the live site. Only GitHub
repository collaborators can publish. No password or token is stored by the editor.

To host a PDF, create a `handouts` folder in the repository and upload it there.
Use a relative link such as `handouts/algebra.pdf` in the editor. External
document links also work. A path to a file on your computer, such as
`/Users/yourname/Downloads/notes.pdf`, cannot be used by site visitors. Leave
the link blank to show a note as coming soon until its file has been uploaded.
AoPS and Discord buttons copy your usernames until you add direct profile or
invite URLs. Gmail, YouTube, Math Stack Exchange, and iNaturalist link directly.
The editor includes fields for each profile.

In **Photos**, select images from your device or enter public image URLs. Add
descriptions for screen readers, optional captions, and move photos up or down.
Device uploads accept JPEG, PNG, WebP, and GIF files up to 15 MB each. They are
resized to at most 1600 pixels on the longest side and embedded in the exported
`index.html`, so there are no separate photo files to upload. Transparency is
preserved; animated images become still images. URL-based photos continue to
load from their original URLs. Visitors can click gallery images to enlarge them.

Drafts use IndexedDB with a localStorage fallback. Older editor drafts are read
automatically. Save a draft before leaving the dashboard; downloading does not
publish. Use **Publish → Start again from the published page → Discard draft**
to replace a local draft with the current page. Clearing browser data removes
local drafts, so keep your downloaded page or commit it to GitHub as a backup.

You can also edit `index.html` manually. Keep its IDs and `data-social`
attributes so the editor can read it. Edit `style.css` to adjust the appearance.

## Check locally

From this directory, run:

```sh
python3 -m http.server 3000 --bind 0.0.0.0
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
