/**
 * @apiDefine admin Admin rights on this shoot are needed.
 * This endpoint can only be used by users with admin rights for this shoot.
 */

 /**
 * @apiDefine viewonly Admin or Participation
 * You either need to be an admin, or to have contributed (and the admin allow viewing) to get this information.
 */

/**
@apiError
Error 403: Forbidden
{
    "msg": "Please provide an API key"
}
*/
