"""
backend/app/services/whatif_service.py - Real-time scenario simulator evaluating marginal changes.
"""
from typing import Any, List
from backend.app.schemas.movie import MovieInput, WhatIfItem, WhatIfRequest, WhatIfResponse
from backend.app.services.predictor import predict_movie


def simulate_whatif(req: WhatIfRequest) -> WhatIfResponse:
    """
    Evaluates what-if counterfactual scenarios by varying a single attribute across a list of values.
    Returns the predicted probability and delta vs baseline for each scenario.
    """
    # 1. Base prediction
    base_res = predict_movie(req.movie)
    base_prob = base_res.hit_probability
    base_label = base_res.label

    results: List[WhatIfItem] = []
    base_dict = req.movie.model_dump()

    for val in req.values:
        scenario_dict = dict(base_dict)

        # Handle varying field logic
        field = req.varying_field
        if field == "budget":
            scenario_dict["budget"] = float(val)
        elif field == "release_date":
            scenario_dict["release_date"] = str(val)
        elif field == "runtime":
            scenario_dict["runtime"] = float(val)
        elif field == "director":
            scenario_dict["director"] = str(val)
        elif field == "franchise":
            scenario_dict["franchise"] = int(val)
        elif field == "genres":
            scenario_dict["genres"] = val if isinstance(val, list) else [str(val)]
        elif field == "cast":
            scenario_dict["cast"] = val if isinstance(val, list) else [str(val)]
        elif field in ("vote_average", "vote_count", "popularity"):
            scenario_dict[field] = float(val)
        else:
            scenario_dict[field] = val

        scenario_movie = MovieInput(**scenario_dict)
        pred_res = predict_movie(scenario_movie)
        p = pred_res.hit_probability
        delta = round(p - base_prob, 4)

        results.append(
            WhatIfItem(
                value=val,
                hit_probability=p,
                label=pred_res.label,
                delta_vs_base=delta,
            )
        )

    return WhatIfResponse(
        varying_field=req.varying_field,
        base_hit_probability=base_prob,
        base_label=base_label,
        results=results,
    )
