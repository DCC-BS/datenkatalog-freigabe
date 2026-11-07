// All SQL sent to the Dataspot Query API. `{person_id}` is substituted by executeQuery()
// only after UUID validation, because the Query API has no parameter binding.

export const DATA_STEWARD_ROLE_LABEL = "Data Steward";

export const PERSONS_QUERY = `
SELECT DISTINCT pe.id, pe.given_name, pe.family_name, u.login_id AS email
FROM holdspost_view hp
JOIN post_view p ON p.id = hp.holds_post
JOIN role_view r ON r.id = p.has_role
JOIN person_view pe ON pe.id = hp.resource_id
JOIN user_view u ON u.is_person = pe.id
JOIN attributedasset_view a ON a.attributed_to = p.id
JOIN dataset_view d ON d.id = a.id
JOIN role_view ar ON ar.id = a.attributed_as
WHERE r.label = '${DATA_STEWARD_ROLE_LABEL}'
  AND ar.label = '${DATA_STEWARD_ROLE_LABEL}'
  AND d.status = 'WORKING'
  AND u.login_id IS NOT NULL
ORDER BY pe.family_name, pe.given_name
`;

export const WORKING_DATASETS_QUERY = `
WITH person_agent AS (
    SELECT hp.holds_post AS agent_id, p.label AS post_label
    FROM holdspost_view hp
    JOIN post_view p ON p.id = hp.holds_post
    JOIN role_view r ON r.id = p.has_role
    WHERE hp.resource_id = '{person_id}'
      AND r.label = '${DATA_STEWARD_ROLE_LABEL}'
)
SELECT DISTINCT
    pa.agent_id AS post_id,
    pa.post_label,
    d.id AS dataset_id,
    d.label AS dataset_label,
    c.id AS collection_id,
    c.label AS collection_label
FROM attributedasset_view a
JOIN person_agent pa ON pa.agent_id = a.attributed_to
JOIN dataset_view d ON d.id = a.id
JOIN collection_view c ON c.id = d.in_collection
JOIN role_view ar ON ar.id = a.attributed_as
WHERE d.status = 'WORKING'
  AND ar.label = '${DATA_STEWARD_ROLE_LABEL}'
ORDER BY pa.post_label, c.label, d.label
`;
