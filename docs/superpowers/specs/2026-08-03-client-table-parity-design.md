# Client Table Parity Design

**Date:** 2026-08-03
**Status:** Approved
**Source:** Client-provided fabric and tube table image reviewed on 2026-08-03

## Goal

Make the bundled calculator data match the active, calculation-ready rows in the client table and prevent future data drift with explicit regression tests.

The change corrects source data only. It does not recalibrate the calculator formulas, change the UI, or introduce new dependencies.

## Chosen Approach

Keep a normalized runtime dataset containing only records that are active and have every value required by the calculator. Test that dataset against an explicit transcription of the client table.

This is preferred over mirroring spreadsheet presentation state such as strike-through formatting, inactive flags, incomplete rows, and unused identifiers. It keeps the existing runtime types and picker behavior simple while ensuring every selectable item can produce a complete calculation.

## Source-Data Policy

### Active and retired rows

- A visibly struck-through row is retired and must not be bundled or selectable.
- The red but non-struck `999` fabric remains active.
- An active spreadsheet row that lacks a calculation-critical value is documented but excluded until the client provides the missing value.
- Values must not be inferred from adjacent rows or guessed from similar products.

### Stored units

- Fabric weight is stored in grams per square metre (`g/m²`).
- Fabric thickness is stored in millimetres (`mm`).
- Tube outside diameter and known wall thickness are stored in millimetres (`mm`).
- Tube weight is stored in pounds per foot (`lb/ft`).
- Tube moment of inertia is stored in inches to the fourth power (`in⁴`).
- The spreadsheet's displayed fabric imperial conversions and tube `mm⁴` column are derived views and are not duplicated in the runtime model.
- The spreadsheet's `Fabric size` column is not used by the current calculator or picker and will not be added to the runtime model.
- The existing fixed tube elasticity value of `10007760 psi` remains unchanged. The supplied client table does not provide a replacement elasticity value.

## Fabric Dataset

The following struck-through fabrics are removed:

- `Mandy new fabric`
- `0g/ft fabric`

The remaining 26 active fabric records are:

| Name | Weight (g/m²) | Thickness (mm) |
|---|---:|---:|
| deluxe | 305 | 0.19 |
| blackout | 407 | 0.55 |
| eco Z-screen | 416 | 0.61 |
| Green 2000 1% | 510 | 0.66 |
| Z-2000 3% | 435 | 0.58 |
| Z-2000 5% | 411 | 0.58 |
| Santa Fe Sunscreen | 562 | 0.61 |
| Sunscreen 3% | 695 | 0.91 |
| Sunscreen 5% | 656 | 0.81 |
| Sunscreen 10% | 600 | 0.81 |
| Texture Z-screen | 435 | 0.72 |
| phifer sheerweave 5000 | 485 | 1.12 |
| Phifer SheerWeave 7000 | 339 | 0.45 |
| Sunrise Blackout | 406 | 0.55 |
| Solarium Screen | 291 | 0.46 |
| Zheer Elegance Eclipse | 158 | 0.45 |
| Zheer Elegance rainforest | 110 | 0.55 |
| 840 | 70 | 0.17 |
| 842 | 78 | 0.14 |
| 849 | 136 | 0.28 |
| 850 | 136 | 0.30 |
| 857 | 48 | 0.18 |
| 858 | 48 | 0.18 |
| 878 | 142 | 0.23 |
| 982 | 270 | 0.34 |
| 999 | 380 | 0.61 |

## Tube Dataset

The following struck-through tubes are removed:

- `3.25" tube trial`
- `1.5 thicker`
- `3" tube -- trial`

`new enclosed bottom bar` is excluded because its outside diameter is blank in the client table. Its provided values (`1.3 mm` thickness, `0.215 lb/ft`, and `0.034052 in⁴`) are documented here but must not be assigned to another tube or made selectable until the client supplies a usable outside diameter and confirms that it belongs in the roller-tube picker.

The 15 active, calculation-ready tube records are:

| Name | Outside diameter (mm) | Thickness (mm) | Weight (lb/ft) | Moment (in⁴) |
|---|---:|---:|---:|---:|
| 1TU | 31.8 | null | 0.192 | 0.027930224 |
| 3TU | 44.5 | null | 0.374 | 0.10795 |
| 2TU | 40.0 | null | 0.291 | 0.065876 |
| T46 | 38.5 | null | 0.308 | 0.068128 |
| 1.25" thicker | 34.2 | null | 0.439 | 0.070151 |
| 1.5" GROOVE | 42.0 | null | 0.626 | 0.156539 |
| T56 | 50.0 | null | 0.500 | 0.196105 |
| 2" groove motor tube | 51.0 | null | 0.642 | 0.239670 |
| 2 3/8" motor tube | 60.8 | null | 0.979 | 0.492173 |
| Acmeda heavy duty tube | 49.0 | 1.75 | 0.708 | 0.241252 |
| SE bottom bar | 21.0 | 2.0 | 0.270 | 0.028421 |
| 14mm round rod(Aluminum) | 10.3 | 2.0 | 0.147 | 0.003651 |
| 2.5" tube | 65.1 | 1.8 | 0.853 | 0.534202 |
| 3.25" tube -ZMC | 87.8 | 2.6 | 2.210 | 2.074289 |
| T26 1 1/8" TUBE | 29.3 | 1.25 | 0.200 | 0.025986 |

The first nine tube thicknesses are stored as `null` because the corresponding client cells are blank. Predefined tube thickness is not used by total-weight, roller-diameter, or deflection calculations; custom tubes still require thickness so their geometry can be derived.

## Calculation Behavior

The formulas in `Android/src/calculations.ts` remain unchanged:

- Total blind weight uses fabric weight, blind area, and bottom-bar linear weight.
- Roller diameter uses the selected tube outside diameter and fabric thickness.
- Tube deflection uses the selected tube weight, selected tube moment of inertia, the fixed elasticity constant, and calculated blind weight.

Correcting tube data therefore changes results for affected selections without changing formula behavior. For the existing 72 by 96 inch `deluxe` and `slim bottom bar w/fab insert` sample, regression coverage will include approximately:

- `Acmeda heavy duty tube`: `0.020924 in`
- `SE bottom bar`: `0.132709 in`
- `14mm round rod(Aluminum)`: `0.934905 in`

Tests will use the calculator's full-precision output and appropriate floating-point tolerances rather than rounded display strings.

## Testing Design

Create a dedicated client-data parity test that:

1. Deep-compares all 26 bundled fabric records with the approved active fabric transcription above.
2. Deep-compares all 15 bundled tube records with the approved active tube transcription above, including `null` thickness values and the unchanged elasticity constant.
3. Explicitly proves retired fabric and tube names are absent.
4. Explicitly proves `new enclosed bottom bar` is absent until its outside diameter is known.
5. Checks the three corrected high-impact tube selections through the real deflection calculation.

The existing boundary, UI, storage, and custom conversion tests remain in the full verification suite.

## Documentation

Update `Android/README.md` to record:

- The client table review date.
- The active dataset counts: 26 fabrics and 15 tubes.
- The interpretation of strike-through as retired.
- The exclusion and known values of `new enclosed bottom bar` pending client confirmation and outside diameter.
- That client-table parity is enforced by an automated test.

## Error Handling and Safety

- Never substitute an adjacent row's values when a record is incomplete.
- Never expose a tube that lacks a positive finite outside diameter, weight, or moment of inertia.
- Treat a parity-test failure as a deliberate data-review requirement, not a snapshot to update automatically.
- Do not use `npm audit fix --force` or perform an Expo SDK migration as part of this work.

## Non-Goals

- Recalibrating formulas or elasticity.
- Adding spreadsheet import or synchronization.
- Adding active/inactive metadata to runtime types.
- Displaying fabric-size identifiers, `oz/yd²`, `inches`, or `mm⁴` in the UI.
- Redesigning pickers or custom-item forms.
- Correcting or adding bottom-bar data not shown in the supplied client table.

## Acceptance Criteria

- Bundled data exactly matches the active, calculation-ready values specified in this document.
- Retired and incomplete records are not selectable.
- High-impact corrected tube rows produce regression-tested deflection results.
- Typecheck, lint, all Jest tests, Expo dependency compatibility, and an Android export complete successfully.
- The feature branch remains the source of PR #1 and is pushed after verification.
