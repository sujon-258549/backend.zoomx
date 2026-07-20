import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { EmailHelper } from "../../utils/emailHelper";
import {
  NotificationPriority,
  NotificationType,
} from "../notification/notification.interface";
import { NotificationService } from "../notification/notification.service";
import TeamMember from "../teamMember/teamMember.model";
import { teamMemberContactSearchableFields } from "./teamMemberContact.constant";
import { ITeamMemberContact } from "./teamMemberContact.interface";
import TeamMemberContact from "./teamMemberContact.model";

const memberPopulate = {
  path: "memberId",
  select: "name email phone designation photoId serial_no isActive is_new",
};

const truncate = (text: string, max = 140) =>
  text.length > max ? `${text.slice(0, max).trim()}…` : text;

const createTeamMemberContact = async (payload: ITeamMemberContact) => {
  const created = await TeamMemberContact.create(payload);
  const populated = await TeamMemberContact.findById(created._id).populate(
    memberPopulate
  );

  // Fire-and-forget — admin notification + member email must never break the
  // public submission. Failures are logged but never thrown to the caller.
  void (async () => {
    try {
      const member = await TeamMember.findById(payload.memberId)
        .select("name email designation")
        .lean();
      const memberName = member?.name ?? "a team member";
      const designation = member?.designation
        ? ` · ${member.designation}`
        : "";

      // 1) Dashboard notification (admin)
      await NotificationService.emit({
        type: NotificationType.TIME_MEMBER_CONTACT,
        title: `New question for ${memberName}${designation}`,
        message: `Phone: ${payload.phone}\nQuestion: ${truncate(payload.question)}`,
        priority: NotificationPriority.HIGH,
        source: {
          module: "teamMemberContact",
          refModel: "TeamMemberContact",
          refId: created._id as never,
        },
        metadata: {
          contactId: String(created._id),
          memberId: String(payload.memberId),
          memberName,
          designation: member?.designation,
          phone: payload.phone,
          questionPreview: truncate(payload.question, 200),
        },
        actionUrl: `/contact/team-contact`,
      });

      // 2) Direct email to the team member
      if (member?.email) {
        try {
          const emailContent = await EmailHelper.createEmailContent(
            {
              memberName: member.name,
              memberDesignation: member.designation ?? "",
              visitorPhone: payload.phone,
              question: payload.question,
              timestamp: new Date().toLocaleString("en-US", {
                timeZone: "Asia/Dhaka",
                dateStyle: "full",
                timeStyle: "long",
              }),
            },
            "teamMemberContact"
          );

          if (emailContent) {
            await EmailHelper.sendEmail(
              member.email,
              emailContent,
              `New message for you from a ZOOM IT visitor`
            );
          }
        } catch (emailErr) {
          console.error(
            "[teamMemberContact] failed to email team member:",
            emailErr
          );
        }
      }
    } catch (err) {
      console.error(
        "[teamMemberContact] post-create side-effects failed:",
        err
      );
    }
  })();

  return populated;
};

const getAllTeamMemberContacts = async (
  params: Record<string, unknown>,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { keyword, ...filterData } = params;

  const searchCondition =
    keyword && teamMemberContactSearchableFields.length > 0
      ? {
          $or: teamMemberContactSearchableFields.map((field) => ({
            [field]: { $regex: keyword, $options: "i" },
          })),
        }
      : {};

  const filterCondition =
    Object.keys(filterData).length > 0
      ? {
          $and: Object.entries(filterData).map(([key, value]) => ({
            [key]: value,
          })),
        }
      : {};

  const whereConditions = {
    ...searchCondition,
    ...filterCondition,
  };

  const data = await TeamMemberContact.find(whereConditions)
    .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(limit)
    .populate(memberPopulate);

  const total = await TeamMemberContact.countDocuments(whereConditions);

  return {
    meta: { page, limit, total },
    data,
  };
};

const getTeamMemberContactById = async (id: string) => {
  const result = await TeamMemberContact.findById(id).populate(memberPopulate);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact entry not found");
  }
  return result;
};

const deleteTeamMemberContact = async (id: string) => {
  const result = await TeamMemberContact.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Contact entry not found");
  }
  return result;
};

export const TeamMemberContactService = {
  createTeamMemberContact,
  getAllTeamMemberContacts,
  getTeamMemberContactById,
  deleteTeamMemberContact,
};
