# Body surface attribution

BodyParts3D, © The Database Center for Life Science.
Source: BodyParts3D 4.0, skin surface FJ2810 / FMA7163 / BP10155.
Official source: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
Official current license page: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html

The official license page (updated 2025-02-27) grants CC Attribution 4.0 International and requests: “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International”.

The downloaded OBJ itself additionally contains the older CC Attribution-Share Alike 2.1 Japan notice. To preserve that notice conservatively, this adapted body mesh is also distributed under CC BY-SA 2.1 Japan: https://creativecommons.org/licenses/by-sa/2.1/jp/. This mesh license does not apply to unrelated SARI application code.

Original embedded notice:
“The license for this database is specified in the Creative Commons Attribution-Share Alike 2.1 Japan. If you use data from this database, please be sure attribute this database as follows: BodyParts3D, (c) The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan.”

SARI adaptations: coordinate normalization, axis conversion, vertex deduplication, binary compression, and no anatomical surface removal or flattening. Every original triangle is retained; a separate opaque cloud cover hides the pelvis in the interface. The model is an adult reference surface, not a patient scan or subject-specific registration target. It is not an anatomical measurement tool.

Preparation: `node scripts/prepare-body.mjs /path/to/FJ2810.obj`.
