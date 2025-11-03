import csv
import json
import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from io import StringIO

from django.conf import settings

# reserved query keywords
OFFSET = "offset"
LIMIT = "limit"
QUERY = "query"
DISTRIB = "distrib"
SHARDS = "shards"
FROM = "from"
TO = "to"
SORT = "sort"
SIMPLE = "simple"

KEYWORDS = [OFFSET, LIMIT, QUERY, DISTRIB, SHARDS, FROM, TO, SORT, SIMPLE]

# standard metadata fields, always included for each result (if available)
FIELD_ID = "id"
FIELD_TYPE = "type"
FIELD_REPLICA = "replica"
FIELD_RETRACTED = "retracted"
FIELD_LATEST = "latest"
FIELD_MASTER_ID = "master_id"
FIELD_INSTANCE_ID = "instance_id"
FIELD_DRS_ID = "drs_id"
FIELD_TITLE = "title"
FIELD_DESCRIPTION = "description"
FIELD_TIMESTAMP = "timestamp"
FIELD_TIMESTAMP_ = "_timestamp"
FIELD_URL = "url"
FIELD_ACCESS = "access"
FIELD_XLINK = "xlink"
FIELD_SIZE = "size"
FIELD_DATASET_ID = "dataset_id"
FIELD_TRACKING_ID = "tracking_id"
FIELD_VERSION = "version"
FIELD_VERSION_ = "_version_"
FIELD_MAX_VERSION = "max_version"
FIELD_MIN_VERSION = "min_version"
FIELD_SCORE = "score"
FIELD_UNITS = "units"

FIELD_CHECKSUM = "checksum"
FIELD_CHECKSUM_TYPE = "checksum_type"
FIELD_INDEX_NODE = "index_node"
FIELD_DATA_NODE = "data_node"
FIELD_NUMBER_OF_FILES = "number_of_files"
FIELD_NUMBER_OF_AGGREGATIONS = "number_of_aggregations"
FIELD_DATASET_ID_TEMPLATE = "dataset_id_template_"
FIELD_DATETIME_START = "datetime_start"
FIELD_DATETIME_STOP = "datetime_stop"
FIELD_TEXT = "text"

# special query fields for open search geo extension
FIELD_BBOX = "bbox"  # west, south, east, north
FIELD_LAT = "lat"
FIELD_LON = "lon"
FIELD_LOCATION = "location"
FIELD_RADIUS = "radius"
FIELD_POLYGON = "polygon"
FIELD_EAST_DEGREES = "east_degrees"
FIELD_WEST_DEGREES = "west_degrees"
FIELD_NORTH_DEGREES = "north_degrees"
FIELD_SOUTH_DEGREES = "south_degrees"
FIELD_HEIGHT_BOTTOM = "height_bottom"
FIELD_HEIGHT_TOP = "height_top"
FIELD_HEIGHT_UNITS = "height_units"
FIELD_VARIABLE_UNITS = "variable_units"
FIELD_GEO = "geo"
FIELD_GEO_UNITS = "geo_units"

# special query fields for open search time extension
FIELD_START = "start"
FIELD_END = "end"

# special query fields for the wget scirpt generator
FIELD_WGET_PATH = "download_structure"
FIELD_WGET_EMPTYPATH = "download_emptypath"

# fields that specify project
FIELD_PROJECT = "project"
FIELD_MIP_ERA = "mip_era"

# fields that are always allowed in queries, in addition to configured facets
CORE_QUERY_FIELDS = [
    FIELD_ID,
    FIELD_TYPE,
    FIELD_REPLICA,
    FIELD_RETRACTED,
    FIELD_LATEST,
    FIELD_MASTER_ID,
    FIELD_INSTANCE_ID,
    FIELD_DRS_ID,
    FIELD_TITLE,
    FIELD_DESCRIPTION,
    FIELD_TIMESTAMP,
    FIELD_TIMESTAMP_,
    FIELD_URL,
    FIELD_XLINK,
    FIELD_SIZE,
    FIELD_NUMBER_OF_FILES,
    FIELD_NUMBER_OF_AGGREGATIONS,
    FIELD_DATASET_ID,
    FIELD_TRACKING_ID,
    FIELD_ACCESS,
    FIELD_VERSION,
    FIELD_MAX_VERSION,
    FIELD_MIN_VERSION,
    FIELD_CHECKSUM,
    FIELD_CHECKSUM_TYPE,
    FIELD_DATA_NODE,
    FIELD_INDEX_NODE,
    FIELD_BBOX,
    FIELD_LAT,
    FIELD_LON,
    FIELD_RADIUS,
    FIELD_POLYGON,
    FIELD_START,
    FIELD_END,
    FIELD_WGET_PATH,
    FIELD_WGET_EMPTYPATH,
    FIELD_PROJECT,
    FIELD_MIP_ERA,
]

# fields that should NOT be used as facets
NOT_FACETS = [
    FIELD_ID,
    FIELD_MASTER_ID,
    FIELD_INSTANCE_ID,
    FIELD_DATASET_ID,
    FIELD_DATASET_ID_TEMPLATE,
    FIELD_DRS_ID,
    FIELD_DATETIME_START,
    FIELD_DATETIME_STOP,
    FIELD_EAST_DEGREES,
    FIELD_WEST_DEGREES,
    FIELD_NORTH_DEGREES,
    FIELD_SOUTH_DEGREES,
    FIELD_BBOX,
    FIELD_LAT,
    FIELD_LON,
    FIELD_RADIUS,
    FIELD_POLYGON,
    FIELD_HEIGHT_BOTTOM,
    FIELD_HEIGHT_TOP,
    FIELD_HEIGHT_UNITS,
    FIELD_LATEST,
    FIELD_REPLICA,
    FIELD_RETRACTED,
    FIELD_NUMBER_OF_FILES,
    FIELD_NUMBER_OF_AGGREGATIONS,
    FIELD_TRACKING_ID,
    FIELD_TIMESTAMP,
    FIELD_TITLE,
    FIELD_DESCRIPTION,
    FIELD_URL,
    FIELD_XLINK,
    FIELD_SIZE,
    FIELD_TEXT,
    FIELD_TYPE,
    FIELD_VARIABLE_UNITS,
    FIELD_GEO,
    FIELD_GEO_UNITS,
    FIELD_TIMESTAMP_,
    FIELD_VERSION_,
    FIELD_SCORE,
    FIELD_UNITS,
]

# unsupported fields
UNSUPPORTED_FIELDS = [
    FIELD_LAT,
    FIELD_LON,
    FIELD_LOCATION,
    FIELD_RADIUS,
    FIELD_POLYGON,
]

# ID fields
ID_FIELDS = [FIELD_ID, FIELD_DATASET_ID, FIELD_MASTER_ID, FIELD_INSTANCE_ID]


def split_value(value):
    """
    Utility method to split an HTTP parameter value into comma-separated
    values but keep intact patterns such as "CESM1(CAM5.1,FV2)
    """

    # first split by comma
    values = [v.strip() for v in value.split(",")]
    values_length = len(values)

    if len(values) == 1:  # no splitting occurred
        return values
    else:  # possibly re-assemble broken pieces
        _values = []
        i = 0
        while i < values_length:
            if i < values_length - 1:
                if (
                    values[i].find("(") >= 0
                    and values[i].find(")") < 0
                    and values[i + 1].find(")") >= 0
                    and values[i + 1].find("(") < 0
                ):
                    _values.append(
                        values[i] + "," + values[i + 1]
                    )  # re-assemble
                    i += 1  # skip next value
                elif (
                    values[i].find("[") >= 0
                    and values[i].find("]") < 0
                    and values[i + 1].find("]") >= 0
                    and values[i + 1].find("[") < 0
                ):
                    _values.append(
                        values[i] + "," + values[i + 1]
                    )  # re-assemble
                    i += 1  # skip next value
                elif (
                    values[i].find("{") >= 0
                    and values[i].find("}") < 0
                    and values[i + 1].find("}") >= 0
                    and values[i + 1].find("{") < 0
                ):
                    _values.append(
                        values[i] + "," + values[i + 1]
                    )  # re-assemble
                    i += 1  # skip next value
                else:
                    _values.append(values[i])
            else:
                _values.append(values[i])
            i += 1

        # convert listo into array
        return _values


def get_solr_shards_from_xml():
    """
    Get Solr shards from the XML file specified in the settings
    as ESGF_SOLR_SHARDS_XML
    """

    shard_list = []
    if os.path.isfile(settings.ESGF_SOLR_SHARDS_XML):
        tree = ET.parse(settings.ESGF_SOLR_SHARDS_XML)
        root = tree.getroot()
        for value in root:
            shard_list.append(value.text)
    return shard_list


def get_allowed_projects_from_json():
    """
    Get allowed ESGF projects from the JSON file specified in the settings
    as ESGF_ALLOWED_PROJECTS_JSON
    """

    allowed_projects_list = []
    if os.path.isfile(settings.ESGF_ALLOWED_PROJECTS_JSON):
        with open(settings.ESGF_ALLOWED_PROJECTS_JSON, "r") as js:
            data = json.load(js)
            allowed_projects_list = data["allowed_projects"]
    return allowed_projects_list


def get_facets_from_solr():
    """
    Get valid facets currently used by the dataset Solr.
    """

    query_url = settings.ESGF_SOLR_URL + "/datasets/select"
    query_params = dict(q="*:*", wt="csv", rows=0)

    query_encoded = urllib.parse.urlencode(query_params, doseq=True).encode()
    req = urllib.request.Request(query_url, query_encoded)
    with urllib.request.urlopen(req) as response:
        results = StringIO(response.read().decode())
        reader = csv.reader(results, delimiter=",")
        facets = next(reader)

    # Remove fields that should NOT be used as facets
    _facets = [f for f in facets if f not in NOT_FACETS]

    return _facets
